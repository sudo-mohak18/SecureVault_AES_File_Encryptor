import random
from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long
import attack

k = 128
key = RSA.generate(8*k)
n, e = key.n, key.e
cred = b'A'*40
ps = bytes([1+(i%255) for i in range(k-3-len(cred))])
em = b'\x00\x02'+ps+b'\x00'+cred
m = bytes_to_long(em)
c0 = pow(m, e, n)
B = 1 << (8*(k-2))

def ceil_div(a,b): return -((-a)//b)
def narrow(M, s):
    new = []
    for a,b in M:
        rmin = ceil_div(a*s - 3*B + 1, n)
        rmax = (b*s - 2*B)//n
        for r in range(rmin, rmax+1):
            na = max(a, ceil_div(2*B + r*n, s))
            nb = min(b, (3*B - 1 + r*n)//s)
            if na <= nb:
                new.append((na,nb))
    new.sort()
    merged=[]
    for a,b in new:
        if merged and a <= merged[-1][1]+1:
            merged[-1]=(merged[-1][0], max(merged[-1][1],b))
        else: merged.append((a,b))
    return merged

# find a valid s (oracle check cheap using m)
s = ceil_div(n, 3*B)
while True:
    v = (m*s) % n
    if 2*B <= v <= 3*B-1:
        em2 = v.to_bytes(k,'big')
        if em2[0]==0 and em2[1]==2 and em2[2:].find(b'\x00')>=8:
            break
    s += 1
print('valid s', s, 'm*s//n', (m*s)//n)
M = narrow([(2*B,3*B-1)], s)
print('intervals', len(M), 'contains m:', any(a<=m<=b for a,b in M))
# now check step2b formula produces s where narrow nonempty containing m
s_prev = s
for trial in range(200):
    a,b = M[0] if len(M)==1 else (None,None)
    if len(M)!=1:
        print('multi', len(M)); break
    r = ceil_div(2*(b*s_prev - 2*B), n)
    print('iter', trial, 'r', r, 's_new', ceil_div(2*B + r*n, b))
    # advance to next valid s by brute force around formula
    s_new = ceil_div(2*B + r*n, b)
    while True:
        v = (m*s_new) % n
        ok = 2*B <= v <= 3*B-1 and v.to_bytes(k,'big')[2:].find(b'\x00')>=8
        if ok: break
        s_new += 1
    M2 = narrow(M, s_new)
    print('  s', s_new, '->', len(M2), 'contains', any(x<=m<=y for x,y in M2))
    M, s_prev = M2, s_new
    if len(M)==1 and M[0][0]==M[0][1]: print('converged'); break
