---
id: install
title: Installation
---

Getting started with Botpress is very easy. You may download the source code and build it yourself, but we also provide and recommend using the binaries.

## As a self-contained binary <a class="toc" id="binary" href="#binary"></a>

This is the easiest way to kick start your development. The server comes already compiled and is bundled with NodeJS 10, nothing else is required.

[Download one of our binary](https://s3.amazonaws.com/botpress-binaries) (available for MAC, Linux and Windows), extract the files and launch the main executable (bp)

If you get the error `Error training model` on Linux, please check the instructions at the end of this page.

## Use our Docker image

The docker images simply loads the linux binary and sets up persistent storage. You may then easily create your Dockerfile based from this image and deploy it in the cloud. There is a tutorial in the [deploying](./deploying) section on how to easily deploy it on Heroku.

## Build from source <a class="toc" id="source" href="#source"></a>

Clone the main git repository and follow the instructions in the readme.

Botpress runs on [Node.js](https://nodejs.org) (version >= 8.2). You must also have either [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com) installed.

## Next steps <a class="toc" id="toc-next-steps" href="#toc-next-steps"></a>

Once you start Botpress, you will be brought to the Admin panel where you can create your first bot. In the next section, we will learn the basic components of a Botpress bot, to better prepare you to create your first customized bot!

## Linux Binary

Our NLU uses the FastText library to process models. On Linux platforms, it may be required to build it locally since it is tied to the system's libraries. If you get an error like the following, you will need to build the library.

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
{
  "intentsDir": "./intents",
  "entitiesDir": "./entities",
  "modelsDir": "./models",
  "provider": "native",
  "debugModeEnabled": true,
  "minimumConfidence": "0.3",
  "fastTextPath": "/home/ubuntu/fastText-0.1.0/fasttext"
}
```

That's it!
