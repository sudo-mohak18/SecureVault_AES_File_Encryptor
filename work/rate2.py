from Crypto.PublicKey import RSA
import time
k=128; B=1<<(8*(k-2))
for trial in range(3):
    key=RSA.generate(1024); n=key.n
    cred=b'admin:'+b'Q'*40
    ps=bytes([1+(i%255) for i in range(k-3-len(cred))])
    m=int.from_bytes(b'\x00\x02'+ps+b'\x00'+cred,'big')
    s0=-((-n)//(3*B))
    hits=[]; inr=0; t0=time.time()
    N=2000000
    v=(m*s0)%n
    step=m%n
    for j in range(N):
        if 2*B<=v<3*B:
            inr+=1
            bb=v.to_bytes(k,'big')
            if bb[0]==0 and bb[1]==2 and bb[2:].find(b'\x00')>=8: hits.append(s0+j)
        v+=step
        if v>=n: v-=n
    print('trial',trial,'s0',s0,'N',N,'inrange',inr,'hits',len(hits),'first',hits[:3],'secs %.1f'%(time.time()-t0), flush=True)
