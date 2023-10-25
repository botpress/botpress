# Hello World

## Description

This is a simple hello-world bot that always reply with text "Hello World!".

## Usage

1. Create a new bot using the Botpress Dashboard or the Botpress CLI.
2. Build the bot using command `bp build`
3. Deploy the bot using command `bp deploy`

## Running locally

There are few different ways of running your bot locally:

```sh
# 1. To run the bundle created by the build command:

bp serve --port 9999

# 2. To run with ts-node:

start_script="import bot from './src'; void bot.start()"
ts-node -T -r @botpress/cli/init -e $start_script
```
