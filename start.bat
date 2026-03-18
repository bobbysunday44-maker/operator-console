@echo off
title OpenClaw — Operator Console
echo.
echo   OpenClaw — Operator Console — Starting...
echo.

:: Use the launcher's virtual environment
set VENV=%~dp0launcher-venv\Scripts\pythonw.exe

if not exist "%VENV%" (
    echo   ERROR: Launcher venv not found at launcher-venv\
    echo   Run: python -m venv launcher-venv
    echo   Then: launcher-venv\Scripts\pip install pywebview pystray Pillow
    pause
    exit /b 1
)

"%VENV%" "%~dp0launch.py"
