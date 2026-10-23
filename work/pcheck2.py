import time
from Crypto.PublicKey import RSA
key=RSA.generate(1024); n=key.n; k=128; B=1<<1008
m=0x0002_5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a
print('m bits', m.bit_length(), 'in range', 2*B<=m<3*B)
c0=pow(m,65537,n)
N=100000
inr=0; valid=0
t0=time.time()
for i in range(N):
    s=15000+i
    pm=key._decrypt(pow(s,65537,n)*c0%n)
    if 2*B<=pm<3*B:
        inr+=1
        b=pm.to_bytes(k,'big')
        if b[0]==0 and b[1]==2 and b[2:].find(b'\x00')>=8: valid+=1
print('inrange',inr,'valid',valid,'p',valid/N,'expected queries',N/max(valid,1),'secs',time.time()-t0)
