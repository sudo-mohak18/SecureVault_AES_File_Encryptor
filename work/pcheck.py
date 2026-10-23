import time, os
from Crypto.PublicKey import RSA
key = RSA.generate(1024)
k=128; n=key.n; B=1<<(8*(k-2))
N=200000
c0=pow(0x1234567890abcdef,65537,n)
inrange=0; valid=0; sep_hist={}
t0=time.time()
for i in range(N):
    s=15054+i
    pm=key._decrypt(pow(s,65537,n)*c0%n)
    if 2*B <= pm <= 3*B-1:
        inrange+=1
        b=pm.to_bytes(k,'big')
        idx=b[2:].find(b'\x00')
        sep_hist[idx]=sep_hist.get(idx,0)+1
        if b[0]==0 and b[1]==2 and idx>=8:
            valid+=1
print('inrange', inrange, 'valid', valid, 'rate_valid', valid/N, 'expected 1/p', N/max(valid,1))
print('total time %.1f' % (time.time()-t0))
print('sep hist first 15:', sorted(sep_hist.items())[:15])
