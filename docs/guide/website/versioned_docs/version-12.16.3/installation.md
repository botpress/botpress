---
id: version-12.16.3-installation
title: Installation
original_id: installation
---

Getting started with Botpress is easy. We build and distribute binaries of the latest stable version and nightly builds of the Github master branch.

## Download

The latest stable binaries are available for download [**here**](https://botpress.com/download). Alternatively, you may find all the versions and nightly builds in our public [**S3 Bucket**](https://s3.amazonaws.com/botpress-binaries/index.html).

## Installation

To install Botpress, unzip the file you download somewhere on your computer. Make sure that your computer has at least:

- Memory (RAM): Recommended 4 GB or above.
- Hard Drive: Recommended 64 GB of free space or above.
- A 64 bits architecture
- The right to read/write to the Botpress directory and subdirectories.

## Starting Botpress

### Executable

To start Botpress, all you have to do is double click on the `bp` file in the directory you extracted Botpress.

Alternatively, you can also start it from the terminal using the command:

```bash
./bp
```
The first time you run Botpress, the built-in modules take some time to install. Thereafter, subsequent runs will be much faster.

Once the modules are installed and loaded, you should see something similar to the screenshot below.

![First Run](assets/server-start.png)

### Commands

You may also start Botpress Server using the Command Line Interface (CLI). To see all the commands available, run `./bp --help`.

![CLI Start](assets/cli-help.png)

## Learn More

Here is a video tutorial to help you set up Botpress on your computer. You can slow it down a bit to follow along.

- [Setting up on Windows](https://youtu.be/xf246NQyMj4)
- [Setting up on Mac](https://youtu.be/SBv0QOXyHL4)
