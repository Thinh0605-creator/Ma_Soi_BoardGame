@echo off
cd /d "%~dp0"
echo 36-ROLE ABSTRACT CURRICULUM SELF-PLAY
echo This does NOT simulate every unique ability exactly.
where py >nul 2>nul
if %errorlevel%==0 (
 py -3 selfplay36.py --games 10000 --players 12
) else (
 python selfplay36.py --games 10000 --players 12
)
echo.
echo Restart the game and press Ctrl+F5 to reload policy.
pause
