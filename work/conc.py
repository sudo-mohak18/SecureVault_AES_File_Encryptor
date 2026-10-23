import socket, time, json, threading
HOST,PORT='2.31.70.16',16241
TOK='otk_305f1191177699ef426be16ecc2c8942'
meta=None
res={}
def worker(i, N=40):
    try:
        s=socket.create_connection((HOST,PORT),timeout=15); f=s.makefile('rwb',0)
        s.sendall(('AUTH %s\n'%TOK).encode()); f.readline(); mm=f.readline(); ack=f.readline()
        m=json.loads(mm); n=int(m['n'],16); e=m['e']; c0=int(m['target_ciphertext'],16)
        t0=time.time()
        s.sendall(''.join('DECRYPT %0256X\n'%(pow(i*100000+j+2,e,n)*c0%n) for j in range(N)).encode())
        r=[f.readline().strip() for _ in range(N)]
        res[i]=(time.time()-t0, ack, set(r), N)
        s.close()
    except Exception as ex:
        res[i]=repr(ex)
ts=[threading.Thread(target=worker,args=(i,)) for i in range(4)]
[t.start() for t in ts]; [t.join() for t in ts]
for k,v in sorted(res.items(), key=lambda x:x[0]): print(k,v, flush=True)
