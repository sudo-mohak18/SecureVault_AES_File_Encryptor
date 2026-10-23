import time, sys
from Crypto.Util.number import bytes_to_long
from Crypto.PublicKey import RSA
import attack

k = 128
key = RSA.generate(1024); n, e = key.n, key.e
cred = b'admin:' + b'Q'*40
ps = bytes([1+(i % 255) for i in range(k-3-len(cred))])
em = b'\x00\x02' + ps + b'\x00' + cred
m = bytes_to_long(em); c0 = pow(m, e, n); B = 1 << (8*(k-2))

_orig = attack.narrow
def checked(M, s, B2, n2):
    out = _orig(M, s, B2, n2)
    assert any(a <= m <= b for a, b in out), 'TRUE m LOST at s=%d' % s
    return out
attack.narrow = checked

class SimConn(attack.Conn):
    def __init__(self, pool): self.pool = pool
    def query_many(self, cs):
        out = []
        for c in cs:
            s = self.pool.cmap[c]
            v = (m*s) % n
            bb = v.to_bytes(k, 'big')
            out.append(2*B <= v < 3*B and bb[0] == 0 and bb[1] == 2 and bb[2:].find(b'\x00') >= 8)
        return out
    def close(self): pass

class SimPool(attack.Pool):
    def __init__(self):
        self.cmap = {}
        self.conns = [SimConn(self)]
        self.n, self.e, self.k, self.c0 = n, e, k, c0
        self.B = B
        self.count = 0
    def _ct(self, s):
        c = pow(s, e, n) * c0 % n
        self.cmap[c] = s
        return c

p = SimPool()
t0 = time.time()
try:
    mm, q = attack.attack(p, log=print, state_file='/tmp/simfast.json', block=8192)
    print('RESULT ok=', mm == m, 'q=', q, 'time %.1f' % (time.time()-t0))
except AssertionError as ex:
    print('FAIL', ex, 'q', p.count)
