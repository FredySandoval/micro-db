if ! command -v unzip &> /dev/null
then
    sudo apt-get install unzip
fi
if ! command -v fnm &> /dev/null
then
    curl -fsSL https://fnm.vercel.app/install | bash
fi

