#!/bin/bash
file="/etc/dhcp/dhcpd.conf"
if [ -f "$file" ]
then
	echo "$file Found!!"
else
	echo "$file Not Found!!"
fi
