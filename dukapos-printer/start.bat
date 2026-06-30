@echo off
echo Starting DukaPOS Printer Service...
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
node server.js
pause
