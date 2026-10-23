import socket, time, json
HOST,PORT='2.31.70.16',16241
TOK='otk_305f1191177699ef426be16ecc2c8942'
s=socket.create_connection((HOST,PORT),timeout=20); f=s.makefile('rwb',0)
s.sendall(('AUTH %s\n'%TOK).encode()); f.readline(); meta=f.readline(); f.readline()
m=json.loads(meta); n=int(m['n'],16); e=m['e']; c0=int(m['target_ciphertext'],16)
N=3000
t0=time.time(); valid=[]
B=64
sent=0
while sent<N:
    ln=''.join('DECRYPT %0256X\n'%(pow(1000000+sent+j,e,n)*c0%n) for j in range(min(B,N-sent)))
    s.sendall(ln.encode())
    for j in range(min(B,N-sent)):
        r=f.readline().strip()
        if r==b'VALID': valid.append(sent+j)
    sent+=B
print('N',N,'valid',len(valid),valid[:20],'time',time.time()-t0,'qps',N/(time.time()-t0), flush=True)
s.close()
