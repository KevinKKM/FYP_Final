sudo iptables -t nat -A PREROUTING -i ens33 -p tcp --dport 1:65535 -j REDIRECT --to-port 10000
sudo iptables -t nat -A OUTPUT -p tcp --dport 1:65535 -j REDIRECT --to-ports 20000 -m owner ! --uid-owner root
