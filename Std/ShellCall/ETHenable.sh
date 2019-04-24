sudo ebtables -P FORWARD ACCEPT
sudo ebtables -P INPUT ACCEPT
sudo ebtables -P OUTPUT ACCEPT
sudo ebtables -D FORWARD -p IPv4 -j ACCEPT
sudo ebtables -D FORWARD -p ARP -j ACCEPT
sudo ebtables -D INPUT -p IPv4 -j ACCEPT
sudo ebtables -D INPUT -p ARP -j ACCEPT
sudo ebtables -D OUTPUT -p IPv4 -j ACCEPT
sudo ebtables -D OUTPUT -p ARP -j ACCEPT
