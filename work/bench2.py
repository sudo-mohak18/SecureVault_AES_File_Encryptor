import socket, time, json
HOST,PORT='2.31.70.16',16241
TOK='otk_305f1191177699ef426be16ecc2c8942'
s=socket.create_connection((HOST,PORT),timeout=20); f=s.makefile('rwb',0)
s.sendall(('AUTH %s\n'%TOK).encode()); f.readline(); meta=f.readline(); print(f.readline())
m=json.loads(meta); n=int(m['n'],16); e=m['e']; c0=int(m['target_ciphertext'],16)
N=50
lines=''.join('DECRYPT %0256X\n'%(pow(i+2,e,n)*c0%n) for i in range(N))
t0=time.time(); s.sendall(lines.encode())
res=[f.readline().strip() for _ in range(N)]
dt=time.time()-t0
print('pipelined', N, 'in', dt, 'qps', N/dt, set(res))
s.close()
