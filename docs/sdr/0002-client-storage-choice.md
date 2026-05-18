# 0002. Client Storage Choice

## Context
The application needs to persist data locally without a backend server, as it's meant to be hosted purely on GitHub Pages.

## Decision
We chose **LocalStorage**.

## Options Considered
1. **IndexedDB:** Better for large-scale data and complex queries.
2. **SessionStorage:** Data is lost on tab close, not meeting requirements.
3. **LocalStorage:** Specifically mandated by the `requirements.md` (FR-13, NFR-05). Easily handles the 500 items and 1000 logs limit specified in NFR-04.

## Consequences
- Data is strictly tied to the user's browser profile and device.
- Clearing browser cache will wipe out the database, which is an accepted limitation (documented in AC-07 / Section 11 of requirements).
- Synchronous API, which is simple but blocking (fine for small data sizes).
