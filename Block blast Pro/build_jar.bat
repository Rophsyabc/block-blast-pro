@echo off
echo Building Block Blast Pro Executable JAR...

if not exist bin mkdir bin

javac -d bin src\main\java\com\ropsoardev\blockblastpro\*.java
if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)

echo Main-Class: com.ropsoardev.blockblastpro.BlockPuzzleUI > manifest.txt
jar cvfm BlockBlastPro.jar manifest.txt -C bin com\ropsoardev\blockblastpro\
del manifest.txt

echo.
echo SUCCESS! Created BlockBlastPro.jar
echo Double-click BlockBlastPro.jar or run "java -jar BlockBlastPro.jar" to launch!
pause
