#!/usr/bin/bash

export PATH=/home/$USER/.fnm:$PATH
eval "`fnm env`"

if ! command -v unzip &> /dev/null
then
    echo "installing unzip..."
    sudo apt-get install unzip
fi


if ! command -v node &> /dev/null
then
    echo "installing fnm..."
    curl -fsSL https://fnm.vercel.app/install | bash
    export PATH=/home/$USER/.fnm:$PATH
    eval "`fnm env`"
fi

if ! command -v node &> /dev/null
then
    echo "installing node..."
    fnm install v16
fi

if ! command -v pm2 &> /dev/null
then
    echo "installing pm2..."
    npm install pm2@latest -g
fi
