from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long
import attack

k=128
key=RSA.generate(1024); n,e=key.n,key.e
cred=b'admin:'+b'Q'*40
ps=bytes([1+(i%255) for i in range(k-3-len(cred))])
em=b'\x00\x02'+ps+b'\x00'+cred
m=bytes_to_long(em); c0=pow(m,e,n); B=1<<(8*(k-2))
print('m in range', 2*B<=m<3*B, 'len', len(em))

class SimConn(attack.Conn):
    def __init__(self): pass
    def query_many(self, cs):
        out=[]
        for c in cs:
            b=key._decrypt(c).to_bytes(k,'big')
            out.append(b[0]==0 and b[1]==2 and b[2:].find(b'\x00')>=8)
        return out
class SimPool(attack.Pool):
    def __init__(self):
        self.conns=[SimConn()]; self.n,self.e,self.k,self.c0=n,e,k,c0; self.B=B; self.count=0
    def _ct(self,s): return pow(s,e,n)*c0%n

p=SimPool()
s0=attack.ceil_div(n,3*B); print('s0',s0)
N=60000
res=p.first_valid_range(s0,N)
print('hit',res,'count',p.count)
# manual check of same range
import time
t0=time.time()
hits=[]
for j in range(N):
    sv=s0+j
    b=key._decrypt(pow(sv,e,n)*c0%n).to_bytes(k,'big')
    if b[0]==0 and b[1]==2 and b[2:].find(b'\x00')>=8: hits.append(sv)
print('manual hits',hits[:5],'n',len(hits),'secs %.1f'%(time.time()-t0))
