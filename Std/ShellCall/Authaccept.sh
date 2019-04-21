sudo arptables -A INPUT -s $1 -j ACCEPT
sudo arptables -A OUTPUT -d $1 -j ACCEPT
sudo iptables -A INPUT -s $1 -j ACCEPT
sudo iptables -A OUTPUT -d $1 -j ACCEPT
