@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Daily Reports - Build and Package Script
echo ============================================
echo.

:: Set paths
set PROJECT_DIR=%~dp0
set OUTPUT_DIR=%PROJECT_DIR%deploy
set STANDALONE_DIR=%PROJECT_DIR%.next\standalone
set STATIC_DIR=%PROJECT_DIR%.next\static
set PUBLIC_DIR=%PROJECT_DIR%public

:: Step 1: Clean previous deployment folder
echo [1/5] Cleaning previous deployment folder...
if exist "%OUTPUT_DIR%" (
    rmdir /s /q "%OUTPUT_DIR%"
)
mkdir "%OUTPUT_DIR%"

:: Step 2: Install dependencies (if node_modules doesn't exist)
if not exist "%PROJECT_DIR%node_modules" (
    echo [2/5] Installing dependencies...
    cd /d "%PROJECT_DIR%"
    call npm install
) else (
    echo [2/5] Dependencies already installed, skipping...
)

:: Step 3: Build the Next.js application
echo [3/5] Building Next.js application...
cd /d "%PROJECT_DIR%"
call npm run build

if errorlevel 1 (
    echo.
    echo ERROR: Build failed! Please check the errors above.
    pause
    exit /b 1
)

:: Step 4: Copy standalone output to deploy folder
echo [4/5] Copying standalone files...
if not exist "%STANDALONE_DIR%" (
    echo ERROR: Standalone folder not found! Make sure next.config.ts has output: "standalone"
    pause
    exit /b 1
)
xcopy "%STANDALONE_DIR%\*" "%OUTPUT_DIR%\" /E /I /H /Y /Q

:: Step 5: Copy static assets
echo [5/5] Copying static assets and config files...

:: Create .next folder in deploy and copy static
mkdir "%OUTPUT_DIR%\.next"
xcopy "%STATIC_DIR%" "%OUTPUT_DIR%\.next\static\" /E /I /H /Y /Q

:: Copy public folder if it exists
if exist "%PUBLIC_DIR%" (
    xcopy "%PUBLIC_DIR%" "%OUTPUT_DIR%\public\" /E /I /H /Y /Q
)

:: Copy web.config
copy "%PROJECT_DIR%web.config" "%OUTPUT_DIR%\web.config" /Y

:: Copy .env files if they exist
if exist "%PROJECT_DIR%.env.local" (
    copy "%PROJECT_DIR%.env.local" "%OUTPUT_DIR%\.env.local" /Y
)
if exist "%PROJECT_DIR%.env.production" (
    copy "%PROJECT_DIR%.env.production" "%OUTPUT_DIR%\.env.production" /Y
)

:: Create logs folder for IIS stdout logging
mkdir "%OUTPUT_DIR%\logs" 2>nul

echo.
echo ============================================
echo   BUILD COMPLETE!
echo ============================================
echo.
echo Deployment package ready at:
echo   %OUTPUT_DIR%
echo.
echo To deploy, copy the CONTENTS of the 'deploy' folder to your IIS site:
echo   \\your-server\path\to\daily-reports\
echo.
echo The folder structure should be:
echo   daily-reports\
echo   ├── .next\static\      (JS/CSS chunks)
echo   ├── public\            (static assets)
echo   ├── logs\              (for IIS logs)
echo   ├── node_modules\      
echo   ├── server.js          
echo   └── web.config         
echo.
pause
