# Sovereignty doctrine

Once Ghost9 is installed, it belongs to the person who installed it. No outside party can throttle it, revoke it, or shut it off.

"No dependencies" in this project means that, not a package count. A dependency is acceptable when it ships inside the artifact, is pinned by version and hash, and the core keeps working if it is removed. A dependency that can be switched off by a third party is not acceptable.

## Rules

1. **Runtime.** Core functions run with no network. No license check, no remote config, no required telemetry, and no remote API call on the critical path.
2. **Artifacts.** Everything the app needs at runtime ships inside the artifact (the APK or the repo). Nothing is downloaded from a third party at install or first run.
3. **Build inputs.** Pinned by version and hash, with the source recorded. A build step that depends on a service must have a mirror or a vendored copy in the repo, or be listed as open debt.
4. **Distribution.** At least two independent copies of the repo and of every release artifact. Today GitHub is the only copy. That is open debt.
5. **Dependencies.** Allowed when bundled, hash-pinned, and removable without breaking the core. Current required Node dependencies: `wink-pos-tagger`, `wordnet-db`. Both are bundled in `node_modules` and run locally.
6. **Network use.** Services bind to loopback only (enforced in `services/clf/clf_service.py` and `src/clf_client.js`). Outbound network happens only for features the user explicitly invokes.
7. **Model.** Bundled inside the artifact. The repo cannot hold a file over 100 MB, so the model is stored as chunks in `models/toxic-bert/` with a SHA3-512 manifest (the algorithm the Ghost kernel uses). `services/clf/fetch_model.py` and the Android build assemble it and check every hash. Nothing is downloaded.

## Audit, 2026-10-28

| Check | Result | Status |
|---|---|---|
| Outbound URLs in `src/` and `services/` | The Hugging Face fetch is removed. The model is assembled from repo chunks. | Pass (after this push) |
| Loopback enforcement | `clf_client.js` refuses non-loopback URLs at load. `clf_service.py` refuses non-loopback binds. | Pass |
| License checks, remote config, telemetry in `src/` | None found. | Pass |
| Service-worker fetch in `src/ghost_persistence.js` | Cache-only now. A miss returns 404 and makes no network call. Regression test `tests/regression/sw_offline.js`. | Pass |
| GitHub Actions pinning | `actions/checkout@v4`, `setup-java@v4`, `setup-gradle@v4`, `upload-artifact@v4`. Pinned by tag, not by commit SHA. | Open: pin by SHA. |
| Android build inputs | Maven Central (`onnxruntime-android`) and Google Maven (Android Gradle Plugin) at build time. | Open: decide on vendoring or a mirror. |
| Distribution | GitHub only. | Open: second copy under the user's control. |
| Node dependencies | `wink-pos-tagger`, `wordnet-db`. Bundled locally. | Pass |

## What this means for the next steps

- The model bundling (rule 7) is the largest open gap. It has to close before the APK counts as sovereign.
- Each open item goes in `docs/review/TECH_DEBT.md` with its status. None is closed by assumption.
