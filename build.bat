
@echo OFF

cd "%~dp0"

del log.txt

echo [%date% %time%] build... >> log.txt

rem call "%~dp0\bin/zip.bat" recovery-sc-addon
rem call "%~dp0\bin/zip.bat" recovery-sc-addon-xposed

rem cd .\output

rem call "%~dp0\bin\zipsign.bat" recovery-sc-addon
rem call "%~dp0\bin\zipsign.bat" recovery-sc-addon-xposed

call "build-make.bat" recovery-sc-addon
call "build-make.bat" recovery-sc-addon-xposed
call "build-make.bat" recovery-sc-addon-xposed-disabler

cd "%~dp0"

echo ===================================================================

type log.txt

echo ===================================================================

pause
