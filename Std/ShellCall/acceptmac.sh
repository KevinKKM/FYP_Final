sudo arptables -A INPUT --src-mac $1 -j ACCEPT
sudo iptables -A INPUT -m mac --mac-source $1 -j ACCEPT
