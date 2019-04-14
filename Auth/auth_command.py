import sys
import os
input_arg = sys.argv
addpeer_ip = input_arg[1]
commandA = ("curl -H Content-type:application/json --data '{\"peer\" : \"ws://%s:6001\"}' http://localhost:3003/addPeer"%addpeer_ip)
commandB = "curl http://127.0.0.1:3003/authall"
os.system(commandA)
os.system(commandB)
