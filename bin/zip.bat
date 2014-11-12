
@echo OFF

cd "%~dp0\..\%1"

del "%~dp0\..\output\%1.zip"

call "%~dp0\7za.exe" a -tzip "%~dp0\..\output\%1.zip"

cd "%~dp0\.."
 
rem pause
