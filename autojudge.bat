@echo off
setlocal enabledelayedexpansion

set "file=%~1"
set "input=%~2"

if "%file%"=="" (
    echo Usage: %~nx0 ^<script_file^>
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running
    exit /b 1
)

:: Get file extension (lowercase)
for %%F in ("%file%") do set "extension=%%~xF"
set "extension=%extension:~1%"
set "extension=%extension:~0,3%"  :: Trim longer extensions if needed

if not exist "%input%" (
    set "input=input"
)

set "command="

if /i "%extension%"=="c" (
    set "command=docker compose run --rm --no-TTY gcc cmd /c \"gcc -lm -O2 -static -o a.out %file% && a.out < %input% && del a.out\""
) else if /i "%extension%"=="cpp" (
    set "command=docker compose run --rm --no-TTY gcc cmd /c \"g++ -lm -O2 -static -o a.out %file% && a.out < %input% && del a.out\""
) else if /i "%extension%"=="js" (
    set "command=docker compose run --rm --no-TTY node npm -s start %file% < %input%"
) else if /i "%extension%"=="py" (
    set "command=docker compose run --rm --no-TTY python python %file% < %input%"
) else if /i "%extension%"=="java" (
    for %%I in ("%file%") do (
        set "dir=%%~dpI"
        set "name=%%~nI"
        set "command=docker compose run --rm --no-TTY java cmd /c \"javac %file% && java -Xmx1024m -Xms1024m -cp !dir! !name! < %input% && del !dir!!name!.class\""
    )
) else (
    echo Unsupported file extension: .%extension%
    exit /b 1
)

:: Run the command
call %command%