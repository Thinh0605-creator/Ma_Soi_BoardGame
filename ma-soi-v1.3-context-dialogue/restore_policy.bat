@echo off
cd /d "%~dp0"
if exist selfplay-policy-backup.json (
 copy /Y selfplay-policy-backup.json selfplay-policy.json >nul
 echo Restored previous policy.
) else (
 echo No backup found.
)
pause
