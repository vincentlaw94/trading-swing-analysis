@echo off
REM ICT-Style Analysis with FVG, ERL, and Standard Deviations
node "%~dp0analyze-ict.js" %1
if "%1"=="" echo.
if "%1"=="" echo Usage: ict.bat [SYMBOL]
if "%1"=="" echo Example: ict.bat ETHUSDC
