
@echo OFF

cd "%~dp0"

echo -------------------------------------- >> log.txt

echo [%date% %time%] build-make %1 >> log.txt

call "%~dp0\bin\zip.bat" %1

cd "%~dp0"

call "%~dp0\bin\zipsign.bat" output\%1

cd "%~dp0"

echo [%date% %time%] done. >> log.txt
