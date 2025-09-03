@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Dicey Drinks dev runner (Windows)
REM - Serves the repo over HTTP on port 5012
REM - Opens the app in your default browser

set PORT=5012
set URL=http://localhost:%PORT%/index.html

REM Change to the directory of this script
cd /d "%~dp0"

echo.
echo ============================================
echo  Dicey Drinks - Dev Server on port %PORT%
echo  Root: %CD%
echo ============================================
echo.

REM Try Python launcher first (py), then python
where py >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Starting server with: py -m http.server %PORT%
    start "dicey-drinks-server" cmd /c "py -m http.server %PORT%"
    goto :OPEN
)

where python >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Starting server with: python -m http.server %PORT%
    start "dicey-drinks-server" cmd /c "python -m http.server %PORT%"
    goto :OPEN
)

REM Try Node http-server via npx (if available)
where npx >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Starting server with: npx http-server -p %PORT% .
    start "dicey-drinks-server" cmd /c "npx http-server -p %PORT% ."
    goto :OPEN
)

echo.
echo ERROR: Could not find a static server to run.
echo - Install Python 3 and ensure 'py' or 'python' is on PATH,
echo   OR install Node.js and 'npx http-server'.
echo.
goto :EOF

:OPEN
REM Give the server a moment to start
ping -n 2 127.0.0.1 >nul 2>&1

REM Open default browser to the app
echo Opening %URL%
start "" "%URL%"
echo.
echo Press Ctrl+C in the server window to stop it when done.
echo.

endlocal
exit /b 0

