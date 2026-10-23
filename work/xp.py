import requests, json, sys
BASE='http://2.31.70.16:16242'
S=requests.Session()
S.post(BASE+'/login', data={'username':'admin','password':'adm_6a62a2f49fa948a4f01abe90'}, timeout=15)

def ask(pred, verbose=False):
    q = "zzz') or (" + pred + ") or ('"
    r = S.get(BASE+'/search', params={'q': q}, timeout=15)
    try:
        j = r.json()
    except Exception:
        print('BAD', r.status_code, r.text[:300]); return None
    res = j.get('results')
    ok = bool(res)
    if verbose:
        print(j.get('query')); print(res)
    return ok, res, j.get('query')

if __name__ == '__main__':
    for pred in sys.argv[1:]:
        out = ask(pred, verbose=True)
        print(pred, '=>', out[0] if out else None)
