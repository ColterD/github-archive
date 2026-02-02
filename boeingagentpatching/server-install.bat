@echo off
setlocal

REM Self-elevate to run as administrator
:CheckPrivileges
NET FILE 1>NUL 2>NUL
if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )

:getPrivileges
if '%1'=='ELEV' (shift & goto gotPrivileges)
setlocal DisableDelayedExpansion
set "batchPath=%~0"
setlocal EnableDelayedExpansion
echo Set UAC = CreateObject("Shell.Application") > "%temp%\getPrivileges.vbs"
echo UAC.ShellExecute "!batchPath!", "ELEV", "", "runas", 1 >> "%temp%\getPrivileges.vbs"
"%temp%\getPrivileges.vbs"
exit /B

:gotPrivileges
setlocal & pushd .

echo Colter's Complete Installation Script for BDI Agent Process
echo Updated: 7/2/24 v1.0
echo Let's go!

echo.
REM Change to the first directory
echo Changing to directory: C:\Software\20240405_RSA_MFA_Agent_x64
cd /d C:\Software\20240405_RSA_MFA_Agent_x64

REM Run the first script directly
echo Running the MFA Agent installation script in 5 seconds...
timeout /t 5
cmd /c "C:\Software\20240405_RSA_MFA_Agent_x64\cmdInstallServers.bat"
echo Waiting for MFA Agent installation to complete...

REM Wait for the first process to finish
:waitForMFAInstall
tasklist /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq cmdInstallServers.bat*" 2>NUL | find /I "cmd.exe" >NUL
if %ERRORLEVEL% == 0 (
    timeout /t 5
    goto waitForMFAInstall
)

cls
echo MFA Agent installation is done. Continuing in 10 seconds...
timeout /t 10

cls
REM Change to the second directory
echo Changing to directory: C:\Software\RSA Netwitness\Endpoint_Agent_2024
cd /d C:\Software\RSA Netwitness\Endpoint_Agent_2024

REM Check if the Endpoint Agent is installed
echo Checking if Endpoint Agent is already installed...
echo You may have to wait up to 30 seconds. Patience!
wmic product where "name like '%%Endpoint_Agent%%'" get name | findstr /I "Endpoint_Agent" >nul
if %ERRORLEVEL% == 0 (
    echo Endpoint Agent is already installed. Continuing in 10 seconds...
    timeout /t 10
) else (
    echo Installing Endpoint Agent...
    msiexec /i "C:\Software\RSA Netwitness\Endpoint_Agent_2024\NWE000064.msi" /quiet /norestart
    echo Waiting for Endpoint Agent installation to complete...
    :waitForEndpointInstall
    tasklist /FI "IMAGENAME eq msiexec.exe" 2>NUL | find /I "msiexec.exe" >NUL
    if %ERRORLEVEL% == 0 (
        timeout /t 5
        goto waitForEndpointInstall
    )
    echo Endpoint Agent installation complete. Continuing in 10 seconds...
    timeout /t 10
)

cls
REM Change to the third directory
echo Changing to directory: C:\Software\Trellix
cd /d C:\Software\Trellix

REM Inform the user before running the Trellix installation
echo Starting the Trellix Agent installation...
echo Please monitor the installation and press OK when prompted.
cmd /c "C:\Software\Trellix\BDI_FramePkg.exe /INSTALL=AGENT /FORCEINSTALL /enableVDImode"

REM Wait for the Trellix process to finish
:waitForTrellixInstall
tasklist /FI "IMAGENAME eq BDI_FramePkg.exe" 2>NUL | find /I "BDI_FramePkg.exe" >NUL
if %ERRORLEVEL% == 0 (
    timeout /t 5
    goto waitForTrellixInstall
)

echo Trellix has been installed. Please press OK if prompted.

REM Clear screen, display final message in green, and prompt user to sign out with a 10-second timer
cls
color 0A
echo Installation Complete.
color 07
echo.
echo It will automatically select Y in 10 seconds.
echo Do you want to sign out of Windows? (Y/N) [Y]: 
choice /t 10 /d Y /n >nul
if %ERRORLEVEL% == 2 (
    echo You chose not to sign out. Exiting script.
    timeout /t 5
) else (
    shutdown /l
)

exit /B
