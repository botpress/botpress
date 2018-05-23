# Botpress Development Bot

## What is it?

This is the sample bot created to simplify the process of developing the botpress core.

## Why is it needed?

Botpress itself is the tool. To see effects of your changes you need to run a sample bot during development.
This is the reference bot. It both provides the standard testing environment and cancels the previously existent need
to create such bot manually outside of the botpress project, and use `yarn` / `npm` linking to make it work with your
dev version of botpress.

## How do I use it?

Clone the entire repo. In the root folder run `yarn install` and then `./node_modules/.bin/lerna bootstrap`.

You need to do bootstrap every time you pull new dependencies from the repository.

Then, each time you start working on botpress:

1. Run `./node_modules/.bin/lerna run compile` in the root folder

1. Run `yarn watch` in every package you plan to work on. This will keep recompiling packages as you make changes.

1. Finally, run `yarn start` in the `dev-bot` folder.


## What can be improved?

There are several things needed for the modern level of DX:

1. Watch bot files and the botpress node bundle file and restart the bot on these changes

1. Watch the botpress web files and enable HMR for the bot

1. Speedup the botpress build time:

    * Do not rebuild node bundle when only the web part has changes
    * Do not build node bundle in development
    * Make each build faster (use caches, incremental builds if possible)
    * Add hot-reload for the server and the client
