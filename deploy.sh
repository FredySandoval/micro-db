#!/bin/bash

# Makes sure the script is executed from its onw current directory
cd "$(dirname "$0")"

# Check if Curl is installed
if ! [ -x "$(command -v curl)" ]; then
    echo 'curl is not installed, Installing...'
    # Install curl
    sudo apt install curl
else 
  echo 'Curl is installed.'
fi
# Check if unzip is installed
if ! [ -x "$(command -v unzip)" ]; then
    echo 'unzip is not installed, Installing...'
    # Install unzip
    sudo apt install unzip
else 
  echo 'unzip is installed.'
fi

# Checking if fnm is installed
if ! [ -x "$(command -v fnm)" ]; then
    echo 'Installing fnm, node version manager...'
  
    # Install node via fnm
    curl -fsSL https://fnm.vercel.app/install | bash
    
    # Append the String 'eval "$(fnm env --use-on-cd)"' to the end of the .bashrc file
    echo 'eval "$(fnm env --use-on-cd)"' >> ~/.bashrc

    # Reload the .bashrc file
else 
  echo 'node is installed.'
fi

source ~/.bashrc

# Checking if fnm is installed
if ! [ -x "$(command -v pm2)" ]; then
    echo 'Installing pm2...'
    # Install pm2
    npm install -g pm2
else 
  echo 'node is installed.'
fi