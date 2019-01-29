---
id: version-11.0.1-troubleshoot
title: Troubleshoot
original_id: troubleshoot
---

If you didn't get any error when starting Botpress for the first time, you can ship this section and move to the [**Quick Start**](/docs/quickstart) guide.

## > I see `Error Training Model`

Botpress Native NLU depends on the fastText library to build and run models. On some Linux distributions, you may be required to build it manually. If you get an error like the following, you will need to compile the library yourself.

> Mod[nlu][native] Error training model

### Prerequisite

If you already have `make` and `g++` installed, you can skip to the next section, `Building`

```bash
sudo apt update
sudo apt install make
sudo apt install g++
```

### Building

Type these commands to generate the binary for your specific platform:

```bash
wget https://github.com/facebookresearch/fastText/archive/v0.1.0.zip
unzip v0.1.0.zip
cd fastText-0.1.0
make
```

Then edit the NLU config file in `data/global/config/nlu.json` and add the `fastTextPath` pointing to the `fasttext` binary

```js
  // ...
  "minimumConfidence": "0.3",
  "fastTextPath": "/home/ubuntu/fastText-0.1.0/fasttext"
  // ...
```
