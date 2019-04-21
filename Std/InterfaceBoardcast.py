from socket import *
import netifaces
from rawsocketpy import RawSocket
import time
import os,sys


if __name__ == '__main__':
    #keyc = 'RkZGRi5GRkZGLkZGRkYuRkZGRg=='

    #H1 = H1.hexdigest()
    NIC_arr = os.popen("ifconfig | grep -e 'flags' | sed \"s/:.*//g\"").read().split("\n")[1:-1] #find all the NIC
    interface_info = []
    #NIC = NIC_arr[0]
    #lines = read_in()#call by protocol
    #np_lines = np.array(lines)
    for NIC in NIC_arr:
        try:
            netcard = netifaces.ifaddresses(NIC)[netifaces.AF_LINK]
            str_mac = netcard[0]['addr']
            net_mac = str_mac.split(":")
            MyIP = netifaces.ifaddresses(NIC)[netifaces.AF_INET][0]['addr']
            interface_info.append("%s<+>%s"%(str_mac,MyIP))
        except:
            print("NIC got some problem....")
    print("|+|".join(interface_info))
    #send_ether(src,dst,usetype,payload,NIC)
