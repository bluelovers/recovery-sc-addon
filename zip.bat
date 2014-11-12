
@rem echo OFF

rem cd "%1"

del "output\%1.zip"

call "%~dp0\bin\7za.exe" a -o="output" -tzip "%1.zip" "%1"

rem cd "%~dp0"
 
pause
