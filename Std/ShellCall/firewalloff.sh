sudo iptables -t nat -D PREROUTING -i ens33 -p tcp --dport 1:65535 -j REDIRECT --to-port 10000
sudo iptables -t nat -D OUTPUT -p tcp --dport 1:65535 -j REDIRECT --to-ports 20000 -m owner ! --uid-owner root
sudo iptables -t nat -D PREROUTING -i ens33 -p udp --dport 1:65535 -j REDIRECT --to-port 10000
sudo iptables -t nat -D OUTPUT -p udp --dport 1:65535 -j REDIRECT --to-ports 20000 -m owner ! --uid-owner root
