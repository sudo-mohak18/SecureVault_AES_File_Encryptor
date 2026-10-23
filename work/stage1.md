# Stage 1 - phishing macro

OLE2 doc: quarterly_invoice.doc (VBA, Module1)
Deobfuscation: StrReverse -> base64 decode -> XOR 0x5A

Result:

    oracle_token=otk_305f1191177699ef426be16ecc2c8942;endpoint=tcp://hived-off-oracle:16241

Actual endpoint: 2.31.70.16:16241
Oracle protocol: AUTH <token>, then DECRYPT <256 uppercase hex> (no semicolon)
  VALID / INVALID
