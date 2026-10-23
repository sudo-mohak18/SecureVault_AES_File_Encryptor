import time
from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long
import attack

k = 128
key = RSA.generate(8 * k)
n, e = key.n, key.e
cred = b'admin:' + b'Q' * 40
ps = bytes([1 + (i % 255) for i in range(k - 3 - len(cred))])
em = b'\x00\x02' + ps + b'\x00' + cred
m = bytes_to_long(em)
c0 = pow(m, e, n)
B = 1 << (8 * (k - 2))

class SimConn(attack.Conn):
    def __init__(self): pass
    def query_many(self, cs):
        out = []
        for c in cs:
            pm = key._decrypt(c)
            b = pm.to_bytes(k, 'big')
            ok = b[0] == 0 and b[1] == 2 and b[2:].find(b'\x00') >= 8
            out.append(ok)
        return out
    def close(self): pass

class SimPool(attack.Pool):
    def __init__(self):
        self.conns = [SimConn()]
        self.n, self.e, self.k, self.c0 = n, e, k, c0
        self.B = B
        self.count = 0
    def _ct(self, s):
        return pow(s, e, n) * c0 % n

p = SimPool()
t0 = time.time()
mm, q = attack.attack(p, log=print, state_file='/tmp/simstate.json', block=2048)
print('recovered ok:', mm == m, 'queries', q, 'time %.1f' % (time.time() - t0))
print('tail:', mm.to_bytes(k, 'big')[-len(cred):])
print('exp :', cred)
