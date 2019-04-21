sudo arptables -A INPUT --src-mac $1 -j ACCEPT
sudo arptables -A OUTPUT --dst-mac $1 -j ACCEPT
sudo iptables -A INPUT -m mac --mac-source $1 -j ACCEPT
sudo iptables -A OUTPUT -d $2 -j ACCEPT
file="/etc/dhcp/dhcpd.conf"
if [ -f "$file" ]
then
	echo "$file Found!!"
	sudo echo "host $1 { hardware ethernet $1; }" >> $file
else
	echo "$file Not Found!!"
fi
