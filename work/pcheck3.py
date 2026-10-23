import time
from Crypto.PublicKey import RSA
key=RSA.generate(1024); n=key.n; k=128; B=1<<1008
ps=bytes([1+(i%255) for i in range(100)])
em=b'\x00\x02'+ps+b'\x00'+b'B'*25
assert len(em)==128
m=int.from_bytes(em,'big')
print('bits',m.bit_length(),'in range',2*B<=m<3*B)
c0=pow(m,65537,n)
N=100000
inr=0; valid=0; first=None
t0=time.time()
for i in range(N):
    s=15000+i
    pm=key._decrypt(pow(s,65537,n)*c0%n)
    if 2*B<=pm<3*B:
        inr+=1
        b=pm.to_bytes(k,'big')
        if b[0]==0 and b[1]==2 and b[2:].find(b'\x00')>=8:
            valid+=1
            if first is None: first=s
print('inrange',inr,'valid',valid,'first',first,'secs %.1f'%(time.time()-t0))
