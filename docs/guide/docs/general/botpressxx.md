---
id: botpressxx
title: Botpress X vs XX
---

The transition from Botpress to Botpress X was a huge game changer, and the latest one from Botpress X to Botpress XX is even bigger.

With Botpress XX, we went back to the roots and completely rewrote the engine from scratch using Typescript. Multi-bot support was added natively. We are giving a much bigger place to modules, which can do a lot more than before. We expose a new SDK that makes it very easy to develop for Botpress.

Here is a summary of the biggest changes brought by this new edition:

1. Multi-bot support is native
1. Distribution is made much more easier by offering [binaries for multiple systems](./install). (node is packaged with BP)
1. Much better native NLU Engine
1. Addition of an [admin panel](./admin) to manage users, roles and bots
1. Usage of Typescript makes it much more easier to develop bots
1. Modules have access to the Botpress SDK to easily communicate with the core
1. Module development is standardized and much more flexible than before
1.

Other minor changes:

1. [Actions](./actions) may be [deployed by modules](../modules/actions)
1. [Hooks](./hooks) have been added to replace `bp.hear` in your `index.js` file
1.
