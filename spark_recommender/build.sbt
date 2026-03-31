name := "SparkRecommender"

version := "1.0"

scalaVersion := "2.12.18"

val sparkVersion = "3.5.0"

libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % sparkVersion,
  "org.apache.spark" %% "spark-sql" % sparkVersion,
  "org.apache.spark" %% "spark-mllib" % sparkVersion
)

fork := true
javaOptions ++= Seq(
  "--add-exports=java.base/sun.nio.ch=ALL-UNNAMED",
  "--add-exports=java.base/java.lang=ALL-UNNAMED",
  "--add-exports=java.base/java.lang.invoke=ALL-UNNAMED",
  "--add-exports=java.base/java.util=ALL-UNNAMED",
  "--add-exports=java.base/sun.security.action=ALL-UNNAMED"
)
