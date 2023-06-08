# Integration Teams

## Description

This integration allows your bot to interact with Microsoft Teams.

## Usage

1. Build the bot using command `pnpm bp build`
2. Deploy the bot using command `pnpm bp deploy`

## Running locally

There are few different ways of running your integration locally:

```sh
# 1. To run the bundle created by the build command:

pnpm bp serve --port 9999

# 2. To run with ts-node:

start_script="import integration from './src'; void integration.start()"
ts-node -T -r @botpress/cli/init -e $start_script
```
