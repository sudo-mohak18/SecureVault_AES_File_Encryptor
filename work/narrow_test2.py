from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long
import attack

k=128
key=RSA.generate(1024); n,e=key.n,key.e
cred=b'A'*40
ps=bytes([1+(i%255) for i in range(k-3-len(cred))])
m=bytes_to_long(b'\x00\x02'+ps+b'\x00'+cred)
B=1<<(8*(k-2))

def ok(s):
    v=(m*s)%n
    b=v.to_bytes(k,'big')
    return 2*B<=v<=3*B-1 and b[0]==0 and b[1]==2 and b[2:].find(b'\x00')>=8

s=attack.ceil_div(n,3*B)
while not ok(s): s+=1
M=attack.narrow([(2*B,3*B-1)],s,B,n)
print('iter0 s',s,'M',len(M),'contains',any(a<=m<=b for a,b in M))
for it in range(1,40):
    if len(M)==1:
        a,b=M[0]
        r=attack.ceil_div(2*(b*s-2*B),n)
        cnt=0
        while True:
            sv=attack.ceil_div(2*B+r*n,b)
            sv=max(sv,s+1)
            cnt+=1
            if ok(sv): break
            r+=1
            if cnt>200000: raise SystemExit('no hit at it %d'%it)
        print('it',it,'r trials',cnt,'s',sv,'ok')
        s=sv
    else:
        sv=s+1
        while not ok(sv): sv+=1
        print('it',it,'2a from',s+1,'to',sv,'tries',sv-s,'intervals',len(M))
        s=sv
    M=attack.narrow(M,s,B,n)
    print('  -> intervals',len(M),'contains',any(a<=m<=b for a,b in M))
    if len(M)==1 and M[0][0]==M[0][1]:
        print('CONVERGED'); break
