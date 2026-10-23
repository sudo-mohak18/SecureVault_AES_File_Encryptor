import socket, time

HOST, PORT = '2.31.70.16', 16241
TOKEN = 'otk_305f1191177699ef426be16ecc2c8942'

class Oracle:
    def __init__(self, host=HOST, port=PORT, token=TOKEN):
        self.s = socket.create_connection((host, port), timeout=20)
        self.f = self.s.makefile('rwb', 0)
        self.s.sendall(('AUTH %s\n' % token).encode())
        self.banner = self.f.readline()
        self.meta = self.f.readline()
        self.ack = self.f.readline()
        self.queries = 0

    def raw(self, line):
        self.s.sendall((line + '\n').encode())
        return self.f.readline().strip().decode()

    def valid(self, c):
        r = self.raw('DECRYPT %0256X' % c)
        self.queries += 1
        while r == 'ERR_BAD_INPUT':
            # ciphertext out of range / retry same value
            r = self.raw('DECRYPT %0256X' % c)
            self.queries += 1
        if r == 'VALID':
            return True
        if r == 'INVALID':
            return False
        raise RuntimeError('unexpected oracle response: %r' % r)
