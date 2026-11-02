@echo off
cd /d "%~dp0"
copy /Y selfplay-policy.json selfplay-policy-backup.json >nul
copy /Y selfplay36-policy.json selfplay-policy.json >nul
echo Activated experimental 36-role policy. Restart server, Ctrl+F5.
pause
