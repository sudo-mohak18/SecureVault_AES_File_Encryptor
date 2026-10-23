import time, os
import attack
p = attack.Pool(nconn=8)
m = p.conns[0]
N = 2048
cands = list(range(500000, 500000 + N))
t0 = time.time()
r = p.first_valid_list(cands)
dt = time.time() - t0
print('N', N, 'time %.2f' % dt, 'qps %.0f' % (N/dt), 'hit', r, 'count', p.count, flush=True)
p.close()
