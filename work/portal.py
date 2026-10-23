import sys, json, requests

BASE = 'http://2.31.70.16:16242'
S = requests.Session()

def login(username, password):
    r = S.post(BASE + '/login', data={'username': username, 'password': password},
               allow_redirects=False, timeout=15)
    print('login ->', r.status_code, r.headers.get('Set-Cookie'), r.text[:300])
    return r

def search(q, raw=False):
    r = S.get(BASE + '/search', params={'q': q}, timeout=15)
    print('search %r -> %s' % (q, r.status_code))
    print(r.text[:2000])
    return r

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'login':
        login(sys.argv[2], sys.argv[3])
        search('alice')
    elif cmd == 'q':
        search(sys.argv[2])
