@echo off
REM %~dp0 is this file's own directory, so the wrapper works under any user name.
REM It ends in a backslash; Git Bash reads the Windows path fine.
"C:\Program Files\Git\bin\bash.exe" "%~dp0statusline-wrapper.sh"
