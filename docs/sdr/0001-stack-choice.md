# 0001. Stack Choice

## Context
The project requires building a single-page web application to manage lab equipment inventory. The UI features forms, lists, and filtering.

## Decision
We chose **Plain HTML, Vanilla JS (ES Modules), and Vanilla CSS**.

## Options Considered
1. **Plain HTML/Vanilla JS/CSS:** Selected. This is the simplest stack, requires no build step (`npm` is not available in the current environment), and satisfies all requirements perfectly using modern JS features (ES6 modules, Template Literals).
2. **Vite + React + TS:** Rejected because the local environment lacks `npm`/Node.js to run the build step.

## Consequences
- Zero build step, enabling ultra-fast local development and deployment via static GitHub Pages.
- State management will require careful DOM manipulation, mitigated by a strict separation of State (`state.js`) and UI (`ui.js`).
