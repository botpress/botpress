# 🚫💩 lint-staged [![Build Status](https://travis-ci.org/okonet/lint-staged.svg?branch=master)](https://travis-ci.org/okonet/lint-staged) [![AppVeyor branch](https://img.shields.io/appveyor/ci/okonet/lint-staged/master.svg)](https://ci.appveyor.com/project/okonet/lint-staged) [![npm version](https://badge.fury.io/js/lint-staged.svg)](https://badge.fury.io/js/lint-staged) [![Codecov](https://codecov.io/gh/okonet/lint-staged/branch/master/graph/badge.svg)](https://codecov.io/gh/okonet/lint-staged)

Run linters against staged git files and don't let :poop: slip into your code base!

## Why

Linting makes more sense when running before committing your code. By doing that you can ensure no errors are going into repository and enforce code style. But running a lint process on a whole project is slow and linting results can be irrelevant. Ultimately you only want to lint files that will be committed.

This project contains a script that will run arbitrary npm and shell tasks with a list of staged files as an argument, filtered by a specified glob pattern.

## Related blogs posts

- [Make Linting Great Again](https://medium.com/@okonetchnikov/make-linting-great-again-f3890e1ad6b8#.8qepn2b5l)
- [Running Jest Tests Before Each Git Commit](https://benmccormick.org/2017/02/26/running-jest-tests-before-each-git-commit/)

> If you've written one, please submit a PR with the link to it!

## Installation and setup

1. `npm install --save-dev lint-staged husky`
1. Install and setup your linters just like you would do normally. Add appropriate `.eslintrc`, `.stylelintrc`, etc.
1. Update your `package.json` like this:
```diff json
{
  "scripts": {
+   "precommit": "lint-staged"
  },
+ "lint-staged": {
+   "*.js": ["eslint --fix", "git add"]
+ }
}
```

Now change a few files, `git add` some of them to your commit and try to `git commit` them.

And this is how it looks like in action:

<p align="center">
  <img src="./screenshots/lint-staged-prettier.gif" alt="lint-staged with prettier example"
       width="640" height="432">
</p>

See [examples](#examples) and [configuration](#configuration) below.

> I recommend using [husky](https://github.com/typicode/husky) to manage git hooks but you can use any other tool.

> **NOTE:**
>
> If you're using commitizen and having following npm-script `{ commit: git-cz }`, `precommit` hook will run twice before commitizen cli and after the commit. [This buggy behaviour is introduced by husky](https://github.com/okonet/lint-staged/issues/152#issuecomment-306046520).
>
> To mitigate this rename your `commit` npm script to something non git hook namespace like, for example `{ cz: git-cz }`

## Configuration

Starting with v3.1 you can now use different ways of configuring it:

* `lint-staged` object in your `package.json`
* `.lintstagedrc` file in JSON or YML format
* `lint-staged.config.js` file in JS format
* Pass a configuration file using the `--config` or `-c` flag

See [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more details on what formats are supported.

Lint-staged supports simple and advanced config formats.

### Simple config format

Should be an object where each value is a command to run and its key is a glob pattern to use for this command. This package uses [minimatch](https://github.com/isaacs/minimatch) for glob patterns.

#### `package.json` example:
```json
{
  "scripts": {
    "my-task": "your-command",
  },
  "lint-staged": {
    "*": "my-task"
  }
}
```

#### `.lintstagedrc` example

```json
{
  "*": "my-task"
}
```

This config will execute `npm run my-task` with the list of currently staged files passed as arguments.

So, considering you did `git add file1.ext file2.ext`, lint-staged will run the following command:

`npm run my-task -- file1.ext file2.ext`

### Advanced config format
To set options and keep lint-staged extensible, advanced format can be used. This should hold linters object in `linters` property.

## Options

* `linters` — `Object` — keys (`String`) are glob patterns, values (`Array<String> | String`) are commands to execute.
* `gitDir` — Sets the relative path to the `.git` root. Useful when your `package.json` is located in a subdirectory. See [working from a subdirectory](#working-from-a-subdirectory)
* `concurrent` — *true* — runs linters for each glob pattern simultaneously. If you don’t want this, you can set `concurrent: false`
* `chunkSize` — Max allowed chunk size based on number of files for glob pattern. This is important on windows based systems to avoid command length limitations. See [#147](https://github.com/okonet/lint-staged/issues/147)
* `subTaskConcurrency` — `1` — Controls concurrency for processing chunks generated for each linter. Execution is **not** concurrent by default(see [#225](https://github.com/okonet/lint-staged/issues/225))
* `verbose` — *false* — runs lint-staged in verbose mode. When `true` it will use https://github.com/SamVerschueren/listr-verbose-renderer.
* `globOptions` — `{ matchBase: true, dot: true }` — [minimatch options](https://github.com/isaacs/minimatch#options) to customize how glob patterns match files.

## Filtering files

It is possible to run linters for certain paths only by using [minimatch](https://github.com/isaacs/minimatch) patterns. The paths used for filtering via minimatch are relative to the directory that contains the `.git` directory. The paths passed to the linters are absolute to avoid confusion in case they're executed with a different working directory, as would be the case when using the `gitDir` option.

```js
{
  // .js files anywhere in the project
  "*.js": "eslint",
  // .js files anywhere in the project
  "**/*.js": "eslint",
  // .js file in the src directory
  "src/*.js": "eslint",
  // .js file anywhere within and below the src directory
  "src/**/*.js": "eslint",
}
```

## What commands are supported?

Supported are both local npm scripts (`npm run-script`), or any executables installed locally or globally via `npm` as well as any executable from your $PATH.

> Using globally installed scripts is discouraged, since lint-staged may not work for someone who doesn’t have it installed.

`lint-staged` is using [npm-which](https://github.com/timoxley/npm-which) to locate locally installed scripts, so you don't need to add `{ "eslint": "eslint" }` to the `scripts` section of your `package.json`. So  in your `.lintstagedrc` you can write:

```json
{
  "*.js": "eslint --fix"
}
```

Pass arguments to your commands separated by space as you would do in the shell. See [examples](#examples) below.

Starting from [v2.0.0](https://github.com/okonet/lint-staged/releases/tag/2.0.0) sequences of commands are supported. Pass an array of commands instead of a single one and they will run sequentially. This is useful for running autoformatting tools like `eslint --fix` or `stylefmt` but can be used for any arbitrary sequences.

## Reformatting the code

Tools like ESLint/TSLint or stylefmt can reformat your code according to an appropriate config  by running `eslint --fix`/`tslint --fix`. After the code is reformatted, we want it to be added to the same commit. This can be done using following config:

```json
{
  "*.js": ["eslint --fix", "git add"]
}
```

~~Starting from v3.1, lint-staged will stash you remaining changes (not added to the index) and restore them from stash afterwards. This allows you to create partial commits with hunks using `git add --patch`.~~ This is still [not resolved](https://github.com/okonet/lint-staged/issues/62)

## Working from a subdirectory

If your `package.json` is located in a subdirectory of the git root directory, you can use `gitDir` relative path to point there in order to make lint-staged work.

```diff json
{
+   "gitDir": "../",
    "linters":{
        "*": "my-task"
    }
}
```

## Examples

All examples assuming you’ve already set up lint-staged and husky in the `package.json`.

```json
{
  "name": "My project",
  "version": "0.1.0",
  "scripts": {
    "precommit": "lint-staged"
  },
  "lint-staged": {}
}
```

*Note we don’t pass a path as an argument for the runners. This is important since lint-staged will do this for you. Please don’t reuse your tasks with paths from package.json.*

### ESLint with default parameters for `*.js` and `*.jsx` running as a pre-commit hook

```json
{
  "*.{js,jsx}": "eslint"
}
```

### Automatically fix code style with `--fix` and add to commit

```json
{
  "*.js": ["eslint --fix", "git add"]
}
```

This will run `eslint --fix` and automatically add changes to the commit. Please note, that it doesn’t work well with committing hunks (`git add -p`).


### Automatically fix code style with `prettier` for javascript + flow or typescript

```json
{
  "*.{js,jsx}": ["prettier --parser flow --write", "git add"]
}
```

```json
{
  "*.{ts,tsx}": ["prettier --parser typescript --write", "git add"]
}
```


### Stylelint for CSS with defaults and for SCSS with SCSS syntax

```json
{
  "*.css": "stylelint",
  "*.scss": "stylelint --syntax=scss"
}
```

### Run PostCSS sorting, add files to commit and run Stylelint to check

```json
{
  "*.scss": [
    "postcss --config path/to/your/config --replace",
    "stylelint",
    "git add"
  ]
}
```
