var ffi = require('ffi');
var StructType = require('ref-struct');
var ref = require('ref');
import * as net from 'net';

const hexToBinary = (s: string): string => {
    let ret: string = '';
    const lookupTable = {
        '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100',
        '5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
        'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101',
        'e': '1110', 'f': '1111'
    };
    for (let i: number = 0; i < s.length; i = i + 1) {
        if (lookupTable[s[i]]) {
            ret += lookupTable[s[i]];
        } else {
            return null;
        }
    }
    return ret;
};

const getOriginalAddr = (client): Array<string> => {
    var current = ffi.Library(null, {
      'getsockopt': [ 'int', [ 'int', 'int', 'int', 'pointer', 'pointer']],
      'ntohs': ['uint16', ['uint16']],
    //    const char *inet_ntop(int af, const void *src, char *dst, socklen_t size);

    });

    var SOL_IP = 0;
    var SO_ORIGINAL_DST = 80;
    var AF_INET = 2;

    var sockaddr_in = StructType([
        ['int16', 'sin_family'],
        ['uint16', 'sin_port'],
        ['uint32', 'sin_addr'],
        ['uint32', 'trash1'],
        ['uint32', 'trash2'],
    ]);

    var dst = new sockaddr_in;
    var dstlen = ref.alloc(ref.types.int, sockaddr_in.size);
    try{
      var r = current.getsockopt(client._handle.fd, SOL_IP, SO_ORIGINAL_DST, dst.ref(), dstlen);
      if (r === -1)
          console.error("getsockopt(SO_ORIGINAL_DST) error");
      if (dst.sin_family !== AF_INET)
          console.error("getsockopt(SO_ORIGINAL_DST) returns unknown family: " + dst.sin_family);

      // TODO: inet_ntop. inet_ntoa is _UNSAFE_
      var ipaddr = dst.ref(); ipaddr = ipaddr[4] + "." + ipaddr[5] + "." + ipaddr[6] + "." + ipaddr[7];

      return [ipaddr, current.ntohs(dst.sin_port)];
    }
    catch(e){
      console.log("Error on retrieving orginial destination");
    }
};


export {hexToBinary,getOriginalAddr};
