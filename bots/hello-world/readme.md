# Hello World

## Description

This is a simple hello-world bot that always reply with text "Hello World!".

## Usage

1. Create a new bot using the CDM, the CLI or directly the botpress API
2. Build the bot using command `pnpm bp build`
3. Deploy the bot using command `pnpm bp deploy`

## Running locally

There are few different ways of running your bot locally:

```sh
# 1. To run the bundle created by the build command:

pnpm bp serve --port 9999

# 2. To run with ts-node:

start_script="import bot from './src'; void bot.start()"
ts-node -T -r @botpress/cli/init -e $start_script
```
