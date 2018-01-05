---
layout: guide
---

The CLI (Command Line Interface) allows you to easily manage your bot from the command line.

You need to have the `botpress` package installed globally (`npm install -g botpress`) to use these commands.

### `init`

Creates and initializes a new bot. Will prompt the user with questions.

```
botpress init
```

**Note:** Must be run inside an empty directory

### `start` or `s` <a class="toc" id="toc-start-or-s" href="#toc-start-or-s"></a>


Starts a bot. This command is only at the root of a valid botpress project.

```
botpress start
# or
botpress start ../path/to/bot
```

If botpress is not installed globally on the host, you may run a bot using `npm start`:

During development, you may want to start the bot with the `--watch` flag. It will then automatically restart whenever you edit your bot's files.

```
botpress start --watch
botpress start --watch --help   # To configure exactly what to watch
```

```
cd path/to/bot && npm start
```

### `list` or `ls` <a class="toc" id="toc-list-or-ls-list" href="#toc-list-or-ls-list"></a>

Lists the botpress modules installed.

```
botpress list
```

### `create` or `c` <a class="toc" id="toc-create-or-c" href="#toc-create-or-c"></a>

Create and initializes a new module.

```
botpress create
```

**Note:** unlike `init`, this command does not run `npm install` after initialization, you need to run it yourself.

**Note 2:** module names must start with `botpress-` and this command will enforce this rule. To know more about modules, please read the [Modules Section](../modules/).

### `--version` or `-V` <a class="toc" id="toc-version-or-v" href="#toc-version-or-v"></a>

Shows the version of the global installation of Botpress

```
botpress --version
```
