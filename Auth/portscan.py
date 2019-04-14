import requests
import json
#url = "http://192.168.2.128:6001"
#r = requests.get(url,timeout=0.01)
#print(r)
count = 0
success = []
for i in range(1,255):
    try:
        ip = ("192.168.2.%s"%i)
        url = ("http://%s:6001"%ip)
        requests.get(url,timeout=0.01)
        #print("%s opening..."%url)
        success.append(ip)
    except:
        count = i
        #print("%s not open"%url)

#print(success)
#datajson = [{"a": "b"},{"c": "d"},{"e": "f"}]
datajson = ""
for record in success:
    datajson = datajson+ "{\"Number\":\"1\",\"IPaddress\":\"%s\",\"type\":\"Router\"},"%record

datajson = datajson[:-1]
datajson = "[%s]"%datajson
print(datajson)
