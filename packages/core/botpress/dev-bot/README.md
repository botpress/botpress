# Botpress Development Bot

## What is it?

This is the sample bot created to simplify the process of developing the botpress core.

## Why is it needed?

Botpress itself is the tool. To see effects of your changes you need to run a sample bot during development.
This is the reference bot. It both provides the standard testing environment and cancels the previously existent need
to create such bot manually outside of the botpress project, and use `yarn` / `npm` linking to make it work with your
dev version of botpress.

This bot is already configured to work with the version of botpress from your clone of the repo.

## How does it work?

It uses the special `file:` syntax for dependencies, supported by npm. That way the bot always works with the botpress built in your project folder.

## How do I use it?

First, you **must have npm >= 5.6.0** to use this properly.
(_Because this is the first version of npm that creates symlinks instead of one-time copy for `file:` deps._)

So now run `npm install` in the `dev-bot` folder. You only need to do it once.

Then, each time you start working on botpress:

1. First, do the normal `yarn install` in the **root** of the botpress project (one level higher than this file's directory).

1. Then run `yarn run watch` there. This will keep recompiling botpress as you make changes.

1. Finally, run `npm start` in the `dev-bot` folder.


## What can be improved?

There are several things needed for the modern level of DX:

1. Watch bot files and the botpress node bundle file and restart the bot on these changes

1. Watch the botpress web files and enable HMR for the bot

1. Speedup the botpress build time:

    * Do not rebuild node bundle when only the web part has changes
    * Make each build faster (use caches, incremental builds if possible)
    * Does yarn support the same symlinking functionality? Should we use it instead?
