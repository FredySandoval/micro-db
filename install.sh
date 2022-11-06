#!/usr/bin/bash

# if ! command -v unzip &> /dev/null
# then
#     echo "installing unzip..."
#     sudo apt-get install unzip
# fi
# echo "fredy sandoval 1"
# command -v node
# if ! command -v node &> /dev/null
# then
#     echo "installing fnm"
#     curl -fsSL https://fnm.vercel.app/install | bash
#     export PATH=/home/$USER/.fnm:$PATH
#     eval "`fnm env`"
# fi

# if ! command -v node &> /dev/null
# then
#     echo "installing node"
#     fnm install v16
# fi
if ! [ -x "$(command -v node )" ]; then
    echo "Dependency node is not installed, Install it and run this script again"
fi
