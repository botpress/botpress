---
id: module
title: Modules
---

Modules are a powerful way to extend the default functionalities of Botpress. They are very useful to encapsulate functionalities so you can reuse them elsewhere. Botpress comes with its own Modules (NLU, Channel-Web, Channel-Messenger, QNA to name a few) but you can also create your custom modules for your own needs.

## Features

- Add new **actions**, **content types**, **hooks** and **skills** that extends Botpress
- Add a **Module View** specific to your new functionalities

Example of Module Views for Analytics, NLU and QNA:

![Sidebar Modules](assets/modules-views.gif)

## List of existing modules

Check out our [existing modules](https://github.com/botpress/botpress/tree/master/modules) to get a better idea of what's possible.

## Enabling or disabling modules

Modules are already bundled with the server binary for the moment. They are bundled in zip files in the folder `modules`. It is possible to enable or disable them by opening the file `data/global/botpress.config.json` in a text editor and setting the value to `true` or `false`

```js
"modules": [
  ...
  {
    "location": "MODULES_ROOT/<module_name>",
    "enabled": true
  }
]
```

## Custom Modules

Learn how to create custom modules [here](../advanced/custom-module).
