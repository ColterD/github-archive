:: Simple Home-Based Environment Setup Script Using Chocolatey https://chocolatey.org
:: Description of what the commands do:
:: choco is the backend command, it's like git or svn checkout
:: install tells it what to do
:: -yr is a headless install where it doesn't ask you to confirm installation or not
::
:: PLEASE READ ME!
:: Anything that beings with two colons :: will not be read or installed.
:: If there is a program that you do not want to install, either delete it from this batch file or comment it out with :: at the beginning
:: This file includes a script which will AUTOMATICALLY UPDATE all of these programs daily at 2AM.  It will abort if it's still not done by 8AM.
:: Windows will not give you any notifications if it needs manual input on doing Updates.  Its up to you to check it once this script has ran.

@echo off
echo [93m Now Windows Update will check for updates, the script will continue in the meanwhile.[0m
echo [93m You won't receive any notifications from Windows Update.  You will need to check progress on your own.[0m
wuauclt /detectnow
wuauclt /updatenow
timeout /t 4 /nobreak > NUL
echo.
echo [93m Now Installing Chocolatey Apps...[0m
timeout /t 1 /nobreak > NUL

:: Required!
choco install -yr chocolatey-core.extension

:: Create Windows Scheduled Task to Run Program Updates at /TIME 2 AM
choco install -yr choco-upgrade-all-at --params "'/DAILY:yes /TIME:02:00 /ABORTTIME:08:00'"

:: AntiMalware/Spyware/Virus
choco install -yr adwcleaner
choco install -yr bleachbit
choco install -yr malwarebytes
choco install -yr shutup10

:: Audio/Visual
choco install -yr k-litecodecpackmega
choco install -yr spotify

:: Basic Windows 10 Stuff
choco install -yr adobeair
choco install -yr flashplayeractivex
choco install -yr flashplayerplugin
choco install -yr jre8
choco install -yr silverlight

:: WARNING - THIS WILL DISABLE WINDOWS User Account Control (UAC)!!
choco install -yr disableuac
:: WARNING - THIS WILL DISABLE WINDOWS User Account Control (UAC)!!

:: Common Software Ninite Alternative
choco install -yr 7zip.install
choco install -yr anydesk
choco install -yr classic-shell
choco install -yr f.lux
choco install -yr git
choco install -yr googlechrome
choco install -yr nodejs.install
choco install -yr qbittorrent
choco install -yr quicktime
choco install -yr teamviewer

:: Gaming
choco install -yr discord
choco install -yr origin
choco install -yr steam
choco install -yr twitch --ignore-checksum

:: **Utility Software
choco install -yr github-desktop
choco install -yr jbs
choco install -yr mremoteng
choco install -yr steam-cleaner
choco install -yr sublimetext3
choco install -yr winscp

:: **Install Last - Restart Required!
choco install -fy dotnetfx --pre
choco install -fy dotnet3.5

:: **Optional Addons
:: choco install -yr audacity audacity-lame
:: choco install -yr authy-desktop
:: choco install -yr autohotkey.install
:: choco install -yr bitnami-xampp
:: choco install -yr citrix-receiver
:: choco install -yr cpu-z
:: choco install -yr crystaldiskinfo
:: choco install -yr dropbox
:: choco install -yr firefox
:: choco install -yr foobar2000
:: choco install -yr foxitreader
:: choco install -yr gimp
:: choco install -yr goggalaxy
:: choco install -yr googledrive
:: choco install -yr googleearth
:: choco install -yr gotomeeting
:: choco install -yr gpu-z
:: choco install -yr hwinfo
:: choco install -yr imgburn
:: choco install -yr itunes
:: choco install -yr lastpass
:: choco install -yr libreoffice-fresh
:: choco install -yr makemkv
:: choco install -yr megasync
:: choco install -yr microsoft-teams.install
:: choco install -yr msiafterburner
:: choco install -yr notepadplusplus.install
:: choco install -yr obs-studio
:: choco install -yr openvpn
:: choco install -yr opera
:: choco install -yr paint.net
:: choco install -yr poweriso
:: choco install -yr putty
:: choco install -yr pycharm-community
:: choco install -yr python2
:: choco install -yr reddit-wallpaper-changer
:: choco install -yr rufus
:: choco install -yr sharex
:: choco install -yr slack
:: choco install -yr speccy
:: choco install -yr sumatrapdf.install -ia "/opt pdfpreviewer"
:: choco install -yr teamspeak
:: choco install -yr telegram.install
:: choco install -yr tor-browser
:: choco install -yr unchecky
:: choco install -yr virtualbox
:: choco install -yr vlc
:: choco install -yr vmwareworkstation
:: choco install -yr winrar
:: choco install -yr winrar
:: choco install -yr wireshark
:: choco install -yr wiztree
:: choco install -yr zoom

:: **Experimental Battle.NET Install https://chocolatey.org/packages/battle.net  (not working from Chocolatey)
:: choco install -yr battle.net --checksum c7f48cc0f1a3bd7cb5f41b96b356ba69

:: Microsoft Baseline Configuration Analyzer (not working from Chocolatey)
:: choco install -yr mbca

:: Adobe Shockwave Player END OF LIFE (not working from Chocolatey)
:: choco install -yr adobeshockwaveplayer --ignore-checksum

echo.
echo [93m Re-enabling Windows Defender...[0m
choco uninstall -y disabledefender-winconfig
echo.
cls
echo [32m Done! [0m

echo.
echo [32m Installation completely finished.[0m
echo.
:choice
echo [96m Would you like to restart Windows now?[0m
set /P c=Please choose Yes (Y) or No (N): 
if /I "%c%" EQU "Y" goto :continue
if /I "%c%" EQU "YES" goto :continue
if /I "%c%" EQU "NO" goto :quit
if /I "%c%" EQU "QUIT" goto :quit
if /I "%c%" EQU "N" goto :quit
goto :choice

:restart
shutdown.exe /r /t 15
pause

:quit
exit