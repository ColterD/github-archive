@"
WSL:
$(wsl --version)
$(wsl -l -v)

Docker VHDX (E:):
$(Get-ChildItem "E:\DockerDesktopWSL" -Recurse -Filter "*.vhdx" -ErrorAction SilentlyContinue | Select FullName,Length | Out-String)

Debian VHDX (E:):
$(Get-ChildItem "E:\WSL\Debian" -Recurse -Filter "*.vhdx" -ErrorAction SilentlyContinue | Select FullName,Length | Out-String)

SMB Multichannel:
$(Get-SmbClientConfiguration | Select EnableMultiChannel | Out-String)

Windows ssh-agent:
$(Get-Service ssh-agent | Select Status,StartType | Out-String)
$(ssh-add -L | Select-Object -First 1 | Out-String)
"@
