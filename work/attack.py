import socket, time, json, os, sys

HOST, PORT = '2.31.70.16', 16241
TOKEN = 'otk_305f1191177699ef426be16ecc2c8942'

class Conn:
    def __init__(self, host=HOST, port=PORT, token=TOKEN):
        self.host, self.port, self.token = host, port, token
        self.open()

    def open(self):
        self.s = socket.create_connection((self.host, self.port), timeout=60)
        self.f = self.s.makefile('rwb', 0)
        self.s.sendall(('AUTH %s\n' % self.token).encode())
        self.banner = self.f.readline()
        self.meta = json.loads(self.f.readline())
        self.ack = self.f.readline()
        if self.ack.strip() != b'OK':
            raise RuntimeError('AUTH failed: %r' % self.ack)
        self.n = int(self.meta['n'], 16)
        self.e = self.meta['e']
        self.k = self.meta['k']
        self.c0 = int(self.meta['target_ciphertext'], 16)

    def _read(self):
        line = self.f.readline().strip()
        if not line:
            raise ConnectionError('empty read')
        if line == b'VALID':
            return True
        if line == b'INVALID':
            return False
        if line == b'ERR_BAD_INPUT':
            return None
        raise RuntimeError('unexpected response %r' % line)

    def query_many(self, cs):
        payload = ''.join('DECRYPT %0256X\n' % c for c in cs).encode()
        for attempt in (0, 1, 2):
            try:
                self.s.sendall(payload)
                return [self._read() for _ in cs]
            except Exception as ex:
                last = ex
                time.sleep(0.5)
                try:
                    self.close()
                except Exception:
                    pass
                self.open()
        raise last

    def close(self):
        try:
            self.f.close()
        except Exception:
            pass
        try:
            self.s.close()
        except Exception:
            pass


def ceil_div(a, b):
    return -((-a) // b)


class Pool:
    def __init__(self, nconn=int(os.environ.get('NPOOL', '8')), host=HOST, port=PORT, token=TOKEN):
        self.conns = [Conn(host, port, token) for _ in range(nconn)]
        m = self.conns[0]
        self.n, self.e, self.k, self.c0 = m.n, m.e, m.k, m.c0
        self.B = 1 << (8 * (self.k - 2))
        self.count = 0

    def _ct(self, s):
        return pow(s, self.e, self.n) * self.c0 % self.n

    def first_valid_list(self, cands):
        """Return smallest candidate s (in given ascending list) with VALID, else None."""
        if not cands:
            return None
        nconn = len(self.conns)
        per = (len(cands) + nconn - 1) // nconn
        results = [None] * nconn
        for i, c in enumerate(self.conns):
            chunk = cands[i * per:(i + 1) * per]
            if not chunk:
                results[i] = []
                continue
            results[i] = c.query_many([self._ct(s) for s in chunk])
        self.count += len(cands)
        for i in range(nconn):
            chunk = cands[i * per:(i + 1) * per]
            for s, v in zip(chunk, results[i]):
                if v:
                    return s
        return None

    def first_valid_range(self, s_start, count):
        return self.first_valid_list(list(range(s_start, s_start + count)))

    def close(self):
        for c in self.conns:
            c.close()


def narrow(M, s, B, n):
    new = []
    for a, b in M:
        rmin = ceil_div(a * s - 3 * B + 1, n)
        rmax = (b * s - 2 * B) // n
        for r in range(max(rmin, 0), rmax + 1):
            na = max(a, ceil_div(2 * B + r * n, s))
            nb = min(b, (3 * B - 1 + r * n) // s)
            if na <= nb:
                new.append((na, nb))
    new.sort()
    merged = []
    for a, b in new:
        if merged and a <= merged[-1][1] + 1:
            merged[-1] = (merged[-1][0], max(merged[-1][1], b))
        else:
            merged.append((a, b))
    return merged


def attack(pool, log=print, state_file='state.json', block=8192):
    n, e, B, c0 = pool.n, pool.e, pool.B, pool.c0
    log('start nbits=%d k=%d Bbits=%d' % (n.bit_length(), pool.k, B.bit_length()))
    s0 = ceil_div(n, 3 * B)
    log('step1 from s=%d' % s0)
    s = None
    while s is None:
        s = pool.first_valid_range(s0, block)
        if s is None:
            s0 += block
            log('step1 ... s=%d q=%d' % (s0, pool.count))
    log('step1 s=%d q=%d' % (s, pool.count))
    M = narrow([(2 * B, 3 * B - 1)], s, B, n)
    log('iter1 intervals=%d width=%d' % (len(M), sum(b - a + 1 for a, b in M)))
    it = 0
    while not (len(M) == 1 and M[0][0] == M[0][1]):
        it += 1
        if not M:
            raise RuntimeError('empty interval set')
        log('iter %d: intervals=%d width=%d q=%d' % (
            it, len(M), sum(b - a + 1 for a, b in M), pool.count))
        if len(M) > 1:
            cand = s + 1
            s_new = None
            while s_new is None:
                s_new = pool.first_valid_range(cand, block)
                if s_new is None:
                    cand += block
                    log('  step2a ... s=%d q=%d' % (cand, pool.count))
        else:
            a, b = M[0]
            r = ceil_div(2 * (b * s - 2 * B), n)
            s_new = None
            spent = 0
            while s_new is None:
                if spent > 250000:
                    log('  step2b stalled (%d queries), falling back to consecutive search' % spent)
                    cand = s + 1
                    while s_new is None:
                        s_new = pool.first_valid_range(cand, block)
                        if s_new is None:
                            cand += block
                            log('  fallback ... s=%d q=%d' % (cand, pool.count))
                    break
                for blk in (8, 32, 128, 512, 2048, 8192):
                    cands = []
                    seen = set()
                    rr = r
                    while len(cands) < blk:
                        for sv in (ceil_div(2 * B + rr * n, b), (3 * B - 1 + rr * n) // a):
                            if sv > s and sv not in seen:
                                seen.add(sv)
                                cands.append(sv)
                        rr += 1
                    cands.sort()
                    s_new = pool.first_valid_list(cands)
                    spent += len(cands)
                    r = rr
                    if s_new is not None:
                        break
                if s_new is None:
                    log('  step2b ... r=%d q=%d' % (r, pool.count))
        s = s_new
        M = narrow(M, s, B, n)
        log('  -> s=%d intervals=%d q=%d' % (s, len(M), pool.count))
        with open(state_file, 'w') as fh:
            json.dump({'s': s, 'M': M, 'queries': pool.count}, fh)
    log('converged q=%d' % pool.count)
    return M[0][0], pool.count


if __name__ == '__main__':
    pool = Pool()
    t0 = time.time()
    m, q = attack(pool)
    dt = time.time() - t0
    print('done %.1fs q=%d qps=%.1f' % (dt, q, q / dt))
    pt = m.to_bytes(pool.k, 'big')
    print('EM hex:', pt.hex())
    print('RAW:', pt)
    open('plaintext.bin', 'wb').write(pt)
    pool.close()
