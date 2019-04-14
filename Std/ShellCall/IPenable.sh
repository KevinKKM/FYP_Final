sudo iptables -P INPUT ACCEPT
sudo iptables -P OUTPUT ACCEPT
#sudo arptables -P OUTPUT DROP
#sudo arptables -P FORWARD DROP
sudo iptables -F
