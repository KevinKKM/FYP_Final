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
s = socket(AF_PACKET, SOCK_RAW, htons(0xaaaa))
s.setsockopt(SOL_SOCKET,SO_REUSEADDR,1)
keyc = ""
magic_str = ":!:"
hellotype = chr(int("aa",16))+chr(int("aa",16))
authtype = chr(int("aa",16))+chr(int("ab",16))
boardcast = chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))

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

def send_ether(src, dst, type, payload, interface="ens33"):
# 48-bit Ethernet addresses
    assert(len(src) == len(dst) == 6)

# 16-bit Ethernet type
    assert(len(type) == 2) # 16-bit Ethernet type
	#s = socket(AF_PACKET, SOCK_RAW)
    s.bind((interface, 0))
    sock = RawSocket("ens33", 0xAAAA)
    #sock.send("some data")
    #sock.send(payload, dest="\xFF\xFF\xFF\xFF\xFF\xFF")
    s.send((dst + src + type + payload))
    print("Send!!!")

def main():
    print("yo")
    #get our data as an array from read_in()

def convertstrmac(raw_mac):
        mac = ""
        for i in range(0,len(raw_mac)/2):
                element = raw_mac[2*i:2+i*2]
                mac = mac + element + ":"
        mac = mac[:-1]
        return mac

def Receive(src,dst,type,payload):
	t = threading.currentThread()
	while getattr(t, "do_run", True):
		print("Listening...")
		try:
			s.settimeout(1.0)
			message = s.recvfrom(4096)
			rectype = message[0].encode('hex')[24:28]
			RecMac  = message[0].encode('hex')[12:24]
			if(rectype=='aaaa'):
				data = message[0].encode('hex')[28:]
#				data = data.encode('hex')[:-28]
				#data = aes_decrypt(data,keyc)
				print(data.decode('hex'))
				if(data.decode('hex')==keyc):
					print(keyc)
                    #macarr = []
                    #macarr.append(RecMac[0:2])
                    #macarr.append(RecMac[2:4])
                    #macarr.append(RecMac[6:8])
                    #macarr.append(RecMac[8:10])
                    #macarr.append(RecMac[10:12])
                    #macarr.append(RecMac[12:14])
                    #RecMac = ".".join(macarr)
					print("<+>|"+convertstrmac(RecMac))
					os.system("/home/kevin/command/enableARP.sh")
					exit()
				if(data.find(':')!=-1):
					msg = data.split(":")[0]
					session = data.split(":")[1]
					ip = data.split(":")[2]
					print("Send to :%s"%ip)
					sendmsg = msg+":"+session+":"
					while(len(sendmsg)%16!=0):
						sendmsg += "0"
					print("Message to send : %s"%sendmsg)
#					print(sendmsg)
					#SendDst = convertmac(RecMac)
					#sendtype = type = chr(int("aa",16))+chr(int("ab",16))
					#message = ip+":"+session+":"
					#sendmsg = aes_encrypt(message,keyc)
					break
				else:
					break
			elif(rectype=='aaab'):
				data = message[0].encode('hex')[28:]
				print("Auth Ethernet Frame")
		except timeout:
			#print("Time out!!")
			t.do_run = False

if __name__ == '__main__':
    #keyc = 'RkZGRi5GRkZGLkZGRkYuRkZGRg=='

    #H1 = H1.hexdigest()
    NIC = os.popen("ifconfig | grep -e 'flags' | sed \"s/:.*//g\"").read().split("\n")[0] #find the first NIC
    lines = read_in()#call by protocol
    np_lines = np.array(lines)
    netcard = netifaces.ifaddresses(NIC)[netifaces.AF_LINK]
    str_mac = netcard[0]['addr']
    net_mac = str_mac.split(":")
    src = chr(int(net_mac[0],16))+chr(int(net_mac[1],16))+chr(int(net_mac[2],16))+chr(int(net_mac[3],16))+chr(int(net_mac[4],16))+chr(int(net_mac[5],16))
    dst = chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))
    #print(np_lines)
    sendmsg = lines[u'data']
    packtype = lines[u'type']
    payload = ""
    MyIP = netifaces.ifaddresses(NIC)[netifaces.AF_INET][0]['addr']
    usetype = hellotype
    if(packtype==2):
        keyhash = sendmsg.split(":")[0]
        realkey = sendmsg.split(":")[1]
        print("Ethernet Hello message")
        #print("Local IP address: %s"%MyIP)
        #print("Local Mac address: %s"%str_mac)
        #print("The key hash: %s"%keyhash)
        #print("The encryption key : %s"%realkey)
        H1 = hashlib.sha256()
        H1.update(keyhash.encode('ascii'))
        H1 = H1.hexdigest()
        lines = read_in()
        print(H1)
        payload = H1
        keyc = H1

    if(packtype==3):
        encryptmsg = sendmsg.split(":")[0]
        realkey = sendmsg.split(":")[1]
        encryptmsg = encryptmsg+magic_str+str_mac+magic_str+MyIP+magic_str
        payload = aes_encrypt(encryptmsg,realkey)
        #print("Encrypted: %s"%payload.decode('hex'))
        decryptmsg = aes_decrypt(payload,realkey).split(magic_str)[0]
        decryptmac = aes_decrypt(payload,realkey).split(magic_str)[1]
        print(aes_decrypt(payload,realkey).split(magic_str))
        usetype = authtype

    send_ether(src,dst,usetype,payload)
    RecThread = threading.Thread(target=Receive, args=(src,dst,type,payload,))
    RecThread.start()
