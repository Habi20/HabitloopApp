@echo off
echo 🚀 Preparing HabitLoop Backend for Deployment...

REM Create deployment directory
if exist deployment rmdir /s /q deployment
mkdir deployment

REM Copy server files
echo 📁 Copying server files...
xcopy /s /e /i server deployment\server

REM Copy shared directory
echo 📁 Copying shared files...
xcopy /s /e /i shared deployment\shared

REM Copy package.json and other config files
echo 📄 Copying configuration files...
copy package.json deployment\
copy tsconfig.json deployment\
copy Procfile deployment\
copy railway.json deployment\

echo ✅ Deployment package ready in 'deployment' folder!
echo 📋 Next steps:
echo 1. Upload all files from 'deployment' folder to your hosting
echo 2. Set environment variables in your hosting panel
echo 3. Configure PostgreSQL database
echo 4. Set startup file to: index.ts
echo.
pause
