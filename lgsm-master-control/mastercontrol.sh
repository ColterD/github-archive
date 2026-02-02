#!/bin/bash
if [ "$EUID" -ne 0 ]
  then echo -e "\\n\\e[1;31m***YOU MUST RUN THIS AS SUDO***\\n\\e[0m"
  exit
fi

title="This script is the master control for all LGSM servers."
options=("Start" "Stop" "Restart" "Update" "Update Functions")

echo -e "\\n\\e[1;34m"
echo -e  "$title"
echo -e "\\e[1;31mWhat would you like to do?\\e[0m"
echo -e "\\e[1;32m"
select opt in "${options[@]}" "Quit"; do 

    case "$REPLY" in

    1 ) echo -e "\\n\\e[1;32mStarting servers...\\e[0m"; bash masterconfig/masterstart-config.sh; echo -e "\\e[1;32mStarting servers... DONE!\\e[0m"; sleep 1; echo -e "\\n\\e[1;33m\\n\\e[0m"; break;;
    2 ) echo -e "\\n\\e[1;31mStopping servers...\\e[0m"; bash masterconfig/masterstop-config.sh; echo -e "\\n\\e[1;31mStopping servers... DONE!\\e[0m"; sleep 1; echo -e "\\n\\e[1;32m\\n\\e[0m"; break;;
    3 ) echo -e "\\n\\e[1;33mRestarting servers...\\e[0m"; bash masterconfig/masterrestart-config.sh; echo -e "\\n\\e[1;33mRestarting servers... DONE!\\e[0m"; sleep 1; echo -e "\\n\\e[1;33m\\n\\n\\e[0m"; break;;
    4 ) echo -e "\\n\\e[1;33mForcing updates...\\e[0m"; bash masterconfig/masterupdate-config.sh; echo -e "\\n\\e[1;33mForcing updates... DONE!\\e[0m"; sleep 1; echo -e "\\n\\e[1;33mServers updated.\\nDon't forget to start all if needed.\\n\\e[0m"; break;;
    5 ) echo -e "\\n\\e[1;33mForcing function updates...\\e[0m"; bash masterconfig/masteruf-config.sh; echo -e "\\n\\e[1;33mForcing function updates... DONE!\\e[0m"; sleep 1; echo -e "\\n\\e[1;33mServers updated.\\n\\n\\e[0m"; break;;

    $(( ${#options[@]}+1 )) ) echo -e "\\n\\e[1;31mCancelled\\e[0m"; exit;;
    *) echo -e "\\n\\e[1;31mSInvalid option.\\e[0m"; continue;;

    esac

done

echo -e "\\e[1;32mALL DONE!\\e[0m\\n"
exit
