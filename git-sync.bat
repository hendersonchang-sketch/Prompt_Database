@echo off
chcp 65001 >nul
echo ===================================
echo   自動同步到 GitHub
echo ===================================

cd /d "%~dp0"

:: 檢查是否有變更
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="" (
    echo [INFO] 沒有需要同步的變更
    goto :end
)

:: 顯示變更
echo.
echo [變更項目]
git status --short

:: 加入所有變更（排除 uploads 和 node_modules）
echo.
echo [STEP 1] 加入變更...
git add app/ components/ lib/ prisma/ *.md *.json *.ts *.js 2>nul

:: 自動產生 commit 訊息
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set TODAY=%%a-%%b-%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set NOW=%%a:%%b

echo [STEP 2] 提交變更...
git commit -m "auto-sync: %TODAY% %NOW%"

:: 推送
echo [STEP 3] 推送到 GitHub...
git push

echo.
echo ===================================
echo   ✅ 同步完成！
echo ===================================

:end
pause
