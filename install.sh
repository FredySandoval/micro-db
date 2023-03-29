#!/usr/bin/bash

export PATH=/home/$USER/.fnm:$PATH
eval "`fnm env`"

if ! command -v unzip &> /dev/null
then
    echo "installing unzip..."
    sudo apt-get install unzip
else
    echo "unzip already installed..."
fi


if ! command -v node &> /dev/null
then
    echo "installing fnm..."
    curl -fsSL https://fnm.vercel.app/install | bash
else
    echo "fnm already installed..."
fi

if ! command -v node &> /dev/null
then
    echo "installing node..."
    fnm install v16
else
    echo "node already install..."
fi

if ! command -v pm2 &> /dev/null
then
    echo "installing pm2..."
    npm install pm2@latest -g
else
    echo "pm2 already installed..."
fi
