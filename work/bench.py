import oracle, time, json, sys
o=oracle.Oracle()
print(o.banner.decode().strip(), flush=True)
print(o.ack.decode().strip(), flush=True)
meta=json.loads(o.meta)
n=int(meta['n'],16); e=meta['e']; k=meta['k']
c0=int(meta['target_ciphertext'],16)
print('bits',n.bit_length(),'k',k, flush=True)
t0=time.time(); N=30
for i in range(N):
    o.valid(pow(i+2,e,n)*c0%n)
dt=time.time()-t0
print('qps', N/dt, 'rtt', dt/N, flush=True)
o.s.close()
