package com.cinematch

import org.apache.spark.sql.SparkSession
import org.apache.spark.ml.recommendation.ALS
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._
import java.io.File

object MovieRecommender {
  def main(args: Array[String]): Unit = {
    
    // Determine absolute paths based on standard project structure
    val currentDir = new File(".").getAbsolutePath
    val dataDir = if (currentDir.contains("spark_recommender")) "../ai_engine/data" else "ai_engine/data"
    
    val ratingsPath = s"$dataDir/ratings.csv"
    val outputPath = s"$dataDir/spark_recommendations.csv"

    println(s"Starting Spark Session...")
    val spark = SparkSession.builder()
      .appName("CineMatch ALS Recommender")
      .master("local[*]")
      .config("spark.driver.memory", "4g")
      .getOrCreate()

    import spark.implicits._

    // Set lower log level to avoid spam
    spark.sparkContext.setLogLevel("WARN")

    println(s"Loading ratings from $ratingsPath...")
    
    // Check if file exists
    if (!new File(ratingsPath).exists()) {
      println(s"ERROR: Ratings file not found at $ratingsPath")
      sys.exit(1)
    }

    // Load Ratings: userId, movieId, rating, timestamp
    val ratingsSchema = StructType(Array(
      StructField("userId", IntegerType, true),
      StructField("movieId", IntegerType, true),
      StructField("rating", DoubleType, true),
      StructField("timestamp", LongType, true)
    ))

    val ratingsDF = spark.read
      .option("header", "true")
      .schema(ratingsSchema)
      .csv(ratingsPath)
      .na.drop() // Drop any missing values

    println(s"Loaded ${ratingsDF.count()} ratings. Training ALS Model...")

    // ALS Model
    val als = new ALS()
      .setMaxIter(15)
      .setRegParam(0.05)
      .setRank(20)
      .setUserCol("userId")
      .setItemCol("movieId")
      .setRatingCol("rating")
      .setColdStartStrategy("drop")

    val model = als.fit(ratingsDF)

    println("Model trained. Generating top 50 personal recommendations for all users...")
    
    // Generate top 50 movie recommendations for each user
    val userRecs = model.recommendForAllUsers(50)

    // Explode the recommendations array to individual rows, and group them as a comma separated string
    val formattedRecs = userRecs
      .select($"userId", explode($"recommendations").as("rec"))
      .select($"userId", $"rec.movieId".as("movieId"), $"rec.rating".as("score"))
      .groupBy("userId")
      .agg(collect_list("movieId").as("recommended_movies"))
      .select($"userId", array_join($"recommended_movies", ",").as("movieIds"))

    println(s"Saving recommendations to $outputPath...")
    
    // Write out the raw CSV (coalesce to a single file and rename it, or write to a dir)
    // We will write to a tempoary directory and rename the part file for ease of use by Python
    val tempOutDir = s"$dataDir/temp_spark_out"
    
    formattedRecs
      .coalesce(1)
      .write
      .mode("overwrite")
      .option("header", "true")
      .csv(tempOutDir)

    // Find the generated csv and rename it
    val outDirFile = new File(tempOutDir)
    if (outDirFile.exists && outDirFile.isDirectory) {
      val partFile = outDirFile.listFiles.find(f => f.getName.startsWith("part-") && f.getName.endsWith(".csv"))
      partFile match {
        case Some(file) => 
          val destFile = new File(outputPath)
          // Overwrite if exists
          if (destFile.exists()) destFile.delete()
          file.renameTo(destFile)
          println(s"Successfully wrote recommendations to $outputPath")
        case None => 
          println("Could not find the part CSV file.")
      }
      
      // Cleanup temp dir
      outDirFile.listFiles.foreach(_.delete())
      outDirFile.delete()
    }

    spark.stop()
    println("Spark job completed successfully.")
  }
}
