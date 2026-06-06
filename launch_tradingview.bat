@echo off
REM Launch TradingView Desktop with Chrome DevTools debugging enabled
REM This allows Claude Code to connect via CDP protocol

echo Launching TradingView with debug port 9222...

REM Common TradingView installation paths - try each one
set TV_PATH1=%LOCALAPPDATA%\TradingView\TradingView.exe
set TV_PATH2=%PROGRAMFILES%\TradingView\TradingView.exe
set TV_PATH3=%PROGRAMFILES(x86)%\TradingView\TradingView.exe

if exist "%TV_PATH1%" (
    start "" "%TV_PATH1%" --remote-debugging-port=9222
    goto :success
)

if exist "%TV_PATH2%" (
    start "" "%TV_PATH2%" --remote-debugging-port=9222
    goto :success
)

if exist "%TV_PATH3%" (
    start "" "%TV_PATH3%" --remote-debugging-port=9222
    goto :success
)

echo ERROR: TradingView not found in common locations.
echo Please install TradingView Desktop or update this script with the correct path.
echo.
echo You can manually launch with:
echo   "path\to\TradingView.exe" --remote-debugging-port=9222
pause
exit /b 1

:success
echo TradingView launched with debug port 9222
echo.
echo Wait for TradingView to fully load, then test connection with:
echo   claude "Use tv_health_check to verify TradingView connection"
echo.
timeout /t 5
