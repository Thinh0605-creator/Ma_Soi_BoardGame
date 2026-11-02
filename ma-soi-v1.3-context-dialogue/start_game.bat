@echo off
cd /d "%~dp0"
echo Ma Soi v1.0 Offline - http://127.0.0.1:8080
start "" "http://127.0.0.1:8080"
where py >nul 2>nul
if %errorlevel%==0 (py -3 -m http.server 8080) else (python -m http.server 8080)
pause
