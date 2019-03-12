sudo ebtables -P FORWARD DROP
sudo ebtables -A FORWARD -p IPv4 -j ACCEPT
sudo ebtables -A FORWARD -p ARP -j ACCEPT
sudo ebtables -P INPUT DROP
sudo ebtables -A INPUT -p IPv4 -j ACCEPT
sudo ebtables -A INPUT -p ARP -j ACCEPT
sudo ebtables -P OUTPUT DROP
sudo ebtables -A OUTPUT -p IPv4 -j ACCEPT
sudo ebtables -A OUTPUT -p ARP -j ACCEPT
