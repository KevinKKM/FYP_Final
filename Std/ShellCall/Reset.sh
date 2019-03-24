file="/etc/dhcp/dhcpd.conf"
if [ -f "$file" ]
then
        echo "DHCP Reset"
	sudo rm /etc/dhcp/dhcpd.conf
	sudo cp /etc/dhcp/dhcpd.conf.bak /etc/dhcp/dhcpd.conf
	sudo chmod 777 /etc/dhcp/dhcpd.conf
else
        echo "No DHCP Service!!"
fi
