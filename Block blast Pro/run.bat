@echo off
echo Launching Block Blast Pro...
if exist BlockBlastPro.jar (
    java -jar BlockBlastPro.jar
) else (
    if not exist bin mkdir bin
    javac -d bin src\main\java\com\ropsoardev\blockblastpro\*.java
    java -cp bin com.ropsoardev.blockblastpro.BlockPuzzleUI
)
