---
id: install
title: Installation
---

Modules are powerful and can add a lot of features to your bot.

## Installing a module

Modules are available as packaged files that you just have to drop in your BP installation directory.

Let's install a new module called `my-module.tgz`

1. Navigate to your Botpress installation directory
1. Copy the file `my-module.tgz` in the `modules` folder
1. Edit `data/global/botpress.config.json` and a new object in the `modules` section, for example:

```js
"modules": [
  ...
  {
    "location": "MODULES_ROOT/my-module",
    "enabled": true
  }
]
```

> Note: Botpress will also load modules that are unzipped.
