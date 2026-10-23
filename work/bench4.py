import time, sys
import attack
for nc in (16, 24):
    try:
        p = attack.Pool(nconn=nc)
        N = 2048
        t0 = time.time()
        r = p.first_valid_list(list(range(900000, 900000 + N)))
        dt = time.time() - t0
        print('conns', nc, 'N', N, 'time %.2f' % dt, 'qps %.0f' % (N/dt), 'hit', r, flush=True)
        p.close()
    except Exception as ex:
        print('conns', nc, 'FAILED', repr(ex), flush=True)
