
@echo OFF

echo Input		: %1.zip
echo Output		: %1-signed.zip
echo .
echo wait...

java -jar "%~dp0\signapk.jar" "%~dp0\testkey.x509.pem" "%~dp0\testkey.pk8" %1.zip %1-signed.zip

echo done.
 
pause
