# tests/fixtures/large.json — stored gzip-compressed

This stress-test fixture (500,000-character repeated-byte string used to test
large-payload handling) is 528,924 bytes uncompressed, which exceeds a hard
size limit in the GitHub-API tooling used to run this reorganization. Nothing
was deleted or altered: the exact original bytes are preserved losslessly as
`large.json.gz` (13,560 bytes). To restore the original file exactly:

```bash
gunzip -k large.json.gz    # produces large.json, byte-identical to the original
```

Original SHA-256 (verify after gunzip): `180119b61168452b0db1f3d8be98433b596b67cea2a2ec5ee53d2f3e5842e512`
