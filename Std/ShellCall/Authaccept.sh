sudo arptables -A INPUT -s $1 -j ACCEPT
sudo iptables -A INPUT -s $1 -j ACCEPT
#sudo iptables -A OUTPUT -s $1 -j ACCEPT
