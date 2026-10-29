# Classifier /score contract (frozen v1)

Every implementation of the Ghost9 classifier must serve this contract on loopback.
The kernel calls it through `src/clf_client.js` and never knows which platform is behind it.

Implementations:
- Desktop: `services/clf/clf_service.py` (Python, onnxruntime).
- Android (planned): Kotlin shell with `onnxruntime-android`, serving the same routes on 127.0.0.1.
- Apple (later): onnxruntime-mobile behind the same routes.

## Transport
- Loopback only: `127.0.0.1`, `localhost`, or `[::1]`. Any other bind is refused.
- HTTP/1.1, `Content-Type: application/json`, UTF-8 bodies.
- Default port `7768`. Clients read the URL from `config/clf.json`.

## Routes

### GET /health
200 `{"ok": true, "model": "<repo>@<revision>"}`

### POST /score
Request: `{"texts": ["...", ...]}`
- `texts` must be an array of strings.
- At most 256 texts per request.
- Body at most 1,000,000 bytes.

Response 200: `{"scores": [number, ...], "model": "<repo>@<revision>"}`
- `scores` has exactly one entry per input text, in input order.
- Each score is a number in [0, 1]: the highest sigmoid output across the model's labels.
- `model` is the pinned identity. Clients use it to check they hit the expected model.
- An empty `texts` array returns 200 with `scores: []`.

Errors (JSON body `{"error": "<message>"}`):
- 400: invalid JSON, `texts` missing or not an array of strings, too many texts, bad Content-Length.
- 404: any other path.
- 413: body over the size limit.

## Privacy
- Request text is never logged, stored, or echoed in errors.
- The service makes no outbound network calls after the model is loaded.

## Conformance
An implementation passes if all of these hold:
1. `/health` returns the model identity with `ok: true`.
2. `POST /score` with N texts returns exactly N scores, each in [0, 1].
3. `texts: []` returns `scores: []`.
4. Malformed bodies get 400 and no stack trace in the body.
5. The same text scores the same value on repeated calls (within 1e-4).
6. The service binds only to loopback.

`tests/regression/clf_wiring.js` covers the client side of items 2, 3, and 6. Item 5 is checked against the desktop implementation. Each new platform needs its own conformance run.

## Versioning
A change to routes, fields, or error codes bumps the contract version and needs a matching client change. A model change keeps the contract and changes the `model` string.
