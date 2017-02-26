## How to use the CLI

You can manage your bot using our powerful CLI tool.

You need to have `botpress` package installed. If you don't have yet, see the [How Start Using](introduction/how-to-start-using.md) guide.
See below the all available commands.

### `init`

Creates and initializes a new bot. Will prompt the user with questions.

```
botpress init
```

**Note:** Must be run inside an empty directory

### `start` &gt; `s`

Starts a bot. This command is only at the root of a valid botpress project.

```
botpress start
# or
botpress start ../path/to/bot
```

If botpress is not installed globally, you may run a bot using `npm start`:

```
cd path/to/bot && npm start
```

### `install` &gt; `i`

Install a local or community module in your bot. This is the equivalent of running `npm install -S botpress-<name>`.

```
botpress install botpress-messenger

# botpress- is optional:
botpress install messenger

# even shorter:
bp i messenger

# local paths are valid:
bp i ~/Desktop/my-module
```

### `uninstall` &gt; `u`

Uninstalls a local or community module. This is the equivalent of running `npm uninstall -S botpress-<name>`

```
botpress uninstall messenger
```

### `list` &gt; `ls`

Lists the botpress modules installed.

```
botpress list
```

### `create` &gt; `c`

Create and initializes a new module.

```
botpress create
```

**Note:** unlike `init`, this command does not run `npm install` after initialization, you need to run it yourself.

**Note 2:** module names must start with `botpress-` and this command will enforce this rule. To know more about modules, please read the [Modules Section](modules/README.md).
