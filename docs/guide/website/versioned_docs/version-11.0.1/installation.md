---
id: version-11.0.1-installation
title: Installation
original_id: installation
---

Getting started with Botpress is very easy. We build and distribute binaries of the latest stable version and we also have nightly builds of the master branch on Github.

## Download

The latest stable binaries are available for download [**here**](https://botpress.io/download). Alternatively, you may find all the versions and nightly builds in our public [**S3 Bucket**](https://s3.amazonaws.com/botpress-binaries/index.html).

## Installation

To install Botpress, simply unzip the file you download somewhere on your computer. Make sure that your computer has at least:

- 512mb of RAM
- 1gb of available disk space
- A 64 bits architecture
- The right to read/write to the directory and subdirectories where Botpress is located

## Starting Botpress

To start Botpress, all you have to do is double click on the `bp` file in the directory you extracted Botpress to.

Alternatively, you can also start it from the terminal:

```
> ./bp
```

The first time you run Botpress, the built-in modules take some time to install. This will only happen the first time you run Botpress, subsequent runs will be much faster.

Once the modules are installed and loaded, you should see something similar to the screenshot below.

![First Run](assets/install-start.jpg)

## Enabling or disabling modules

Modules are already bundled with the server binary for the moment. They are bundled in zip files in the folder `modules`. It is possible to enable or disable them by opening the file `data/global/botpress.config.json` in a text editor and setting the value to `true` or `false`

```js
"modules": [
  ...
  {
    "location": "MODULES_ROOT/module_name",
    "enabled": true
  }
]
```
