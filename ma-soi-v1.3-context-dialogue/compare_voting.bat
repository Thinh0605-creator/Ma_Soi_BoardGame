@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py -3 compare_voting.py --games 500 --players 8) else (python compare_voting.py --games 500 --players 8)
pause
