:: Simple Home-Based Environment Setup Script Using Chocolatey | https://chocolatey.org
:: Version 1.3 by ColterD

::Check for Admin Privs, if not Exit
@rem
echo OFF
cls

NET SESSION >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    ECHO [93m Administrator Privileges Detected![0m
    timeout /t 1 /nobreak > NUL
) ELSE (
   echo.
   echo       [91m  ######## ########  ########   #######  ########  [0m
   echo       [91m  ##       ##     ## ##     ## ##     ## ##     ## [0m
   echo       [91m  ##       ##     ## ##     ## ##     ## ##     ## [0m
   echo       [91m  ######   ########  ########  ##     ## ########  [0m
   echo       [91m  ##       ##   ##   ##   ##   ##     ## ##   ##   [0m
   echo       [91m  ##       ##    ##  ##    ##  ##     ## ##    ##  [0m
   echo       [91m  ######## ##     ## ##     ##  #######  ##     ## [0m
   echo.
   echo.
   echo    [93m####### ERROR: ADMINISTRATOR PRIVILEGES REQUIRED #########[0m
   echo    This script must be run as administrator to work properly!  
   echo      Right click the file and select "Run As Administrator"
   echo    [93m##########################################################[0m
   echo.
   PAUSE
   EXIT /B 1
)
:: This maximizes the screen
if not "%1" == "max" start /MAX cmd /c %0 max & exit/b

:: Confirm if user has edited the config.bat or it will install the default shipped programs
echo.
echo.
:choice
echo "/   /                                     /   /"
echo "| O |                                     | O |"
echo "|   |- - - - - - - - - - - - - - - - - - -|   |"
echo "| O |                                     | O |"
echo "|   |                                     |   |"
echo "| O |                                     | O |"
echo "|   |                                     |   |"
echo "| O |                                     | O |"
echo "|   |        [91m W A I T ![0m                   |   |"
echo "| O |                                     | O |"
echo "|   |   Did you configure the             |   |"
echo "| O |      config.bat file to have your   | O |"
echo "|   |             program selection?      |   |"
echo "| O |                                     | O |"
echo "|   |                                     |   |"
echo "| O |                                     | O |"
echo "|   |                                     |   |"
echo "| O |- - - - - - - - - - - - - - - - - - -| O |"
echo "|   |                                     |   |"
echo.
set /P c=Please choose Yes (Y) or No (N): 
if /I "%c%" EQU "Y" goto :continue
if /I "%c%" EQU "YES" goto :continue
if /I "%c%" EQU "NO" goto :quit
if /I "%c%" EQU "QUIT" goto :quit
if /I "%c%" EQU "N" goto :quit
goto :choice

:continue
echo.
echo. [32mOff we go then!...[0m
echo.
echo [93m Now Installing Chocolatey...[0m
echo.
echo [93m Please wait...[0m
echo.
timeout /t 1 /nobreak > NUL

:: This installs Chocolatey Core
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
cls

echo [93m Initial Installation Finished![0m
timeout /t 1 /nobreak > NUL
echo.
echo [93m Temporarily Disabling Windows Defender...[0m
timeout /t 1 /nobreak > NUL
echo.
:: This temporarily disables Windows Defender due to a false positive on config.bat as a Trojan
choco install -yr disabledefender-winconfig

echo.
cls
echo [93m Now Running config.bat File...[0m
timeout /t 4 /nobreak > NUL
CALL :CHECK_FAIL
echo.

:: This takes the script back to the current directory (if changed) and runs the config.bat within the same window.
cd /d %~dp0
config.bat
CALL :CHECK_FAIL
GOTO :EOF

:: If Script Fails, this tells it to exit
:quit
echo.
echo Well, go fix that!
echo Quitting in 3 seconds...
timeout /t 4 /nobreak > NUL
:CHECK_FAIL
if NOT ["%errorlevel%"]==["0"] (
    pause
    exit /b %errorlevel%
)