#!/bin/bash
if ! command -v unzip &> /dev/null
then
    sudo apt-get install unzip
fi
if ! command -v fnm &> /dev/null
then
    curl -fsSL https://fnm.vercel.app/install | bash
    export PATH=/home/$USER/.fnm:$PATH
    eval "`fnm env`"
fi
if ! command -v node &> /dev/null
then
    fnm install v16
fi
