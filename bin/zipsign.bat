
@echo OFF

echo Input		: %1.zip
echo Output		: %1-signed.zip
echo .
echo wait...

echo delete: %1-signed.zip

del %1-signed.zip

echo sign...

java -jar "%~dp0\signapk.jar" "%~dp0\testkey.x509.pem" "%~dp0\testkey.pk8" %1.zip %1-signed.zip

echo Signed		: %1-signed.zip

echo done.
echo ...
echo ..
echo .

rem exit