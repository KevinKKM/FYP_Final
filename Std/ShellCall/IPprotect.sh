sudo iptables -P INPUT DROP
#sudo iptables -P OUTPUT DROP
sudo iptables -A INPUT -s 127.0.0.1 -j ACCEPT
#sudo iptables -A OUTPUT -s 127.0.0.1 -j ACCEPT
#sudo arptables -P OUTPUT DROP
#sudo arptables -P OUTPUT DROP
#sudo arptables -P FORWARD DROP
