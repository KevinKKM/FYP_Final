from socket import *
import netifaces
from rawsocketpy import RawSocket
import json
import numpy as np
from multiprocessing import Process
from Crypto.Cipher import AES
import base64
import time
import hashlib
import os,sys
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.fernet import Fernet
global keyc,H1
import threading
_IV = 16* '\x00'
ETH_P_ALL = 3
UDP_IP = "127.0.0.1"
UDP_PORT = 9999
count = 0
s = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL))
s.setsockopt(SOL_SOCKET,SO_REUSEADDR,1)
keyc = ""
magic_str = ":!:"
hellotype = chr(int("aa",16))+chr(int("aa",16))
authtype = chr(int("aa",16))+chr(int("ab",16))
boardcast = chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))
sock = socket(AF_INET,SOCK_DGRAM)
#s.bind((interface, 0))

def read_in():
    lines = sys.stdin.readlines()
    if(len(lines)>0):
        return json.loads(lines[0])
    else:
        return lines
def aes_encrypt(data, key):
        while(len(data)%16!=0):
               data += "0"
        md5key = hashlib.md5()
        md5key.update(key)
        md5key = md5key.hexdigest()
        cryptor = AES.new(md5key, AES.MODE_CBC, _IV)
        return cryptor.encrypt(data)

def aes_decrypt(data, key):
        md5key = hashlib.md5()
        md5key.update(key)
        md5key = md5key.hexdigest()
        cryptor = AES.new(md5key, AES.MODE_CBC, _IV)
#       print("This is data "+data)
        return cryptor.decrypt(data)

def convertstrmac(raw_mac):
        mac = ""
        for i in range(0,len(raw_mac)/2):
                element = raw_mac[2*i:2+i*2]
                mac = mac + element + ":"
        mac = mac[:-1]
        return mac

def Receive(src,dst,type,my_ip,nic_mac):
	t = threading.currentThread()
	while getattr(t, "do_run", True):
		#print("Listening...")
		try:
			#print("hi")
			message = s.recvfrom(4096)
			rectype = message[0].encode('hex')[24:28]
			RecMac  = message[0].encode('hex')[12:24]
			#print(str(message[0].encode('hex')))
			#sock.sendto(str(message[0].encode('hex')), (UDP_IP, UDP_PORT))
			CheckMine = False
			for mac in nic_mac:
				if(RecMac==mac):
					CheckMine = True
					break
			if(rectype=='aaaa' and CheckMine==False):
				receIP = netifaces.ifaddresses(message[1][0])[netifaces.AF_INET][0]['addr']
				data = message[0].encode('hex')[28:]
				if(CheckMine):
					print("That's mine")
                                sock.sendto(data.decode('hex')+"|+|%s|+|%s|+|"%(convertstrmac(RecMac),receIP), (UDP_IP, UDP_PORT))
				print("got something!! "+data.decode('hex'))
				if(data.decode('hex')==keyc):
					print("<+>|"+convertstrmac(RecMac))
					strmac = convertstrmac(RecMac)
					exit()
		except timeout:
			print("Time out!!")
			#t.do_run = False

if __name__ == '__main__':
    print("hi")
    NIC_arr = os.popen("ifconfig | grep -e 'flags' | sed \"s/:.*//g\"").read().split("\n")[:-1] #find all the NICs
    authNIC = NIC_arr[0]
    NIC_arr = NIC_arr[1:]
    mac_arr = []
    #lines = read_in()#call by protocol
    #np_lines = np.array(lines)
    for cur_nic in NIC_arr:
        curnetcard = netifaces.ifaddresses(cur_nic)[netifaces.AF_LINK]
        #print(curnetcard)
        mactemp = curnetcard[0]['addr'].split(":")
        if(cur_nic!="lo"):
            mac_arr.append("".join(mactemp).encode())
    print(mac_arr)
    netcard = netifaces.ifaddresses(authNIC)[netifaces.AF_LINK]
    str_mac = netcard[0]['addr']
    net_mac = str_mac.split(":")
    src = chr(int(net_mac[0],16))+chr(int(net_mac[1],16))+chr(int(net_mac[2],16))+chr(int(net_mac[3],16))+chr(int(net_mac[4],16))+chr(int(net_mac[5],16))
    dst = chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))
    #print(np_lines)
    MyIP = netifaces.ifaddresses(authNIC)[netifaces.AF_INET][0]['addr']
    Receive(src,dst,type,MyIP,mac_arr)

    #send_ether(src,dst,usetype,payload)
    #RecThread = threading.Thread(target=Receive, args=(src,dst,type,))
    #RecThread.start()
