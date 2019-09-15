---
id: version-11.8.0-release-notes
title: Release Notes
original_id: release-notes
---

The transition from Botpress to Botpress X was a huge game changer, and the latest one from Botpress X to Botpress Server (v11) is even bigger.

## What's new in Botpress Server

There are 4 major differences between Botpress X (10.x) and Botpress Server (11.x).

- **v11** is not an NPM library anymore – it is a standalone application. We distribute binaries of v11 for OSX, Windows, Linux and Docker on a daily basis.
- **v11** now supports multiple bots natively – thus the naming of Botpress Server.
- **v11** is a complete backend rewrite to TypeScript. We have made significant architectural changes [that are not backward-compatible](/docs/migrate).
- We introduced our first version of [Botpress Native NLU](/docs/build/nlu)

---

With Botpress Server, we went back to the roots and completely rewrote the engine from scratch using Typescript. Multi-bot support was added natively. We are giving a much bigger place to modules, which can do a lot more than before. We expose a new SDK that makes it very easy to develop for Botpress.

### Other minor changes

- Modules can now deploy [Actions](/docs/build/code)
- Modules can export static assets
- [Hooks](/docs/build/code) have been added to replace `bp.hear` in your `index.js` file
