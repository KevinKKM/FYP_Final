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
input_arg = sys.argv

def mac_toRaw(mac):
    mac_arr = mac.split(":")
    raw_mac = chr(int(mac_arr[0],16))+chr(int(mac_arr[1],16))+chr(int(mac_arr[2],16))+chr(int(mac_arr[3],16))+chr(int(mac_arr[4],16))+chr(int(mac_arr[5],16))
    return raw_mac

def send_ether(src, dst, type, payload, interface):
# 48-bit Ethernet addresses
    assert(len(src) == len(dst) == 6)

# 16-bit Ethernet type
    assert(len(type) == 2) # 16-bit Ethernet type
	#s = socket(AF_PACKET, SOCK_RAW)
    s.bind((interface, 0))
    s.send((dst + src + type + payload))
    print("Send by %s!!!"%interface)

if __name__ == '__main__':
    #keyc = 'RkZGRi5GRkZGLkZGRkYuRkZGRg=='

    #H1 = H1.hexdigest()
    NIC_arr = os.popen("ifconfig | grep -e 'flags' | sed \"s/:.*//g\"").read().split("\n")[1:-1] #find all the NIC
    print(NIC_arr)

    #NIC = NIC_arr[0]
    #lines = read_in()#call by protocol
    #np_lines = np.array(lines)
    for NIC in NIC_arr:
        try:
            netcard = netifaces.ifaddresses(NIC)[netifaces.AF_LINK]
            str_mac = netcard[0]['addr']
            net_mac = str_mac.split(":")
            src = chr(int(net_mac[0],16))+chr(int(net_mac[1],16))+chr(int(net_mac[2],16))+chr(int(net_mac[3],16))+chr(int(net_mac[4],16))+chr(int(net_mac[5],16))
            dst = chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))+chr(int("ff",16))
    #print(np_lines)
    #sendmsg = lines[u'data']
    #packtype = lines[u'type']
            if(len(input_arg)<2):
                payload = "|+|e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855|+|0|+|"
            else:
                if(len(input_arg)==3):
                    dst = mac_toRaw(input_arg[2])
                payload = input_arg[1]
            MyIP = netifaces.ifaddresses(NIC)[netifaces.AF_INET][0]['addr']
            usetype = hellotype
            if(NIC!="lo"):
                send_ether(src,dst,usetype,json.dumps(payload),NIC)
        except:
            print("NIC got some problem....")
    #send_ether(src,dst,usetype,payload,NIC)
