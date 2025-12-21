@echo off
title Prompt Database Server
cd /d "%~dp0"
echo ========================================
echo   Prompt Database Server Starting...
echo ========================================
echo.
npm run dev
pause
