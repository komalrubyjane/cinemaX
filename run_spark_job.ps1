# run_spark_job.ps1
# Helper script to run the Scala Spark Recommendation Engine

Write-Host "Starting the Spark Recommender build process..." -ForegroundColor Cyan

$CurrentDir = Get-Location
$SparkDir = "$CurrentDir\spark_recommender"

# 1. Automate Java Installation if missing
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    $JdkDir = "$SparkDir\jdk"
    if (!(Test-Path "$JdkDir\jdk-17.0.9+8\bin\java.exe")) {
        Write-Host "Java not found. Downloading Portable Microsoft OpenJDK 17..." -ForegroundColor Yellow
        $JdkZip = "$SparkDir\jdk.zip"
        Invoke-WebRequest -Uri "https://aka.ms/download-jdk/microsoft-jdk-17.0.9-windows-x64.zip" -OutFile $JdkZip
        
        Write-Host "Extracting JDK (this may take a minute)..." -ForegroundColor Yellow
        Expand-Archive -Path $JdkZip -DestinationPath $JdkDir -Force
        Remove-Item $JdkZip
    }
    
    # Set Temporary Environment Variables for this Session
    $env:JAVA_HOME = "$JdkDir\jdk-17.0.9+8"
    $env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
    Write-Host "Temporary Java Environment Initialized." -ForegroundColor Green
}

# 2. Automate SBT Installation if missing
$SbtDir = "$SparkDir\sbt"
if (!(Get-Command sbt -ErrorAction SilentlyContinue) -and !(Test-Path "$SbtDir\bin\sbt.bat")) {
    Write-Host "SBT not found. Downloading portable SBT 1.9.8..." -ForegroundColor Yellow
    $SbtZip = "$SparkDir\sbt.zip"
    Invoke-WebRequest -Uri "https://github.com/sbt/sbt/releases/download/v1.9.8/sbt-1.9.8.zip" -OutFile $SbtZip
    
    Write-Host "Extracting SBT..." -ForegroundColor Yellow
    Expand-Archive -Path $SbtZip -DestinationPath $SparkDir -Force
    Remove-Item $SbtZip
}

$SbtCmd = "sbt"
if (Test-Path "$SbtDir\bin\sbt.bat") {
    $SbtCmd = "$SbtDir\bin\sbt.bat"
}

# Navigate to the spark project directory
Set-Location -Path $SparkDir

Write-Host "Compiling and running the Scala Spark ALS job via SBT..." -ForegroundColor Yellow
Write-Host "This will take a few minutes the first time to download Spark dependencies." -ForegroundColor Gray

try {
    & $SbtCmd "runMain com.cinematch.MovieRecommender"
} catch {
    Write-Host "Execution caught an error."
}
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "Spark Recommendations successfully generated!" -ForegroundColor Green
    Write-Host "The new recommend engine output is saved to ai_engine/data/spark_recommendations.csv"
} else {
    Write-Host "Spark job failed with exit code $exitCode." -ForegroundColor Red
}

# Return to initial location
Set-Location -Path $CurrentDir
