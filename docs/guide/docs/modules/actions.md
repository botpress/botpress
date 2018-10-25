---
id: actions
title: Actions
---

Actions are javascript snippets that are called by the Dialog Engine when an action is present on the node. All actions are executed in a virtual machine to prevent it to bring the bot down should there be a scripting error. Actions are discussed more thoroughly in the [getting started page](../getting_started/actions)

There is no way to register actions programatically, they must be present in the folder `data/global/actions` to be visible on the flow editor.

To move your actions to that folder, follow these steps:

1. Create a folder named `actions` in `src`
1. Add your javascript files in the folder
1. When you build your module, your files will be copied in the `dist` folder
1. At every startup, action files are copied in `data/global/actions/${my-module}/`

They are then accessible via `my-module/myaction` by any node or skill

If your action requires external dependencies, you must add them on your module's `package.json` as dependencies. When the VM is initialized, we redirect `require` requests to the node_modules of its parent module.

> Many dependencies are already included with Botpress and do not need to be added to your package (ex: lodash, axios, etc... )
