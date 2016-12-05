<a href='http://botpress.io'><img src='/assets/screenshot-ui.png'></a>
# <a href='http://botpress.io'><img src='https://httpsimage.com/img/botpress-logo-120.png' height='60'></a>

Botpress is an open-source bot creation tool written in Javascript. It is powered by a rich set of open-source (and proprietary) modules built by the community. In fact, Botpress is a tool that helps creating awesome chatbots and have total control over it.

## ALPHA TESTERS

Important: **Make sure to join the official Facebook Group (https://www.facebook.com/groups/656491441198667/)!**

## Vision & Mission

Botpress is on mission to make bots ubiquitous and profitable for everybody. At Botpress, we think that using close source building tools is not the right way to build awesome chatbots. To be able to create something great, it's important to have full control over it ant it's exactly what Botpress offers!   

## Target audience

Botpress is at an early stage and we are looking for **node developers** to build new modules, create chatbots and help the community to build something **huge**... Everyone will benefits to have a powerful open-source tool with a wide variety of specialized modules. 

## Installation

Botpress requires [node](https://nodejs.org) (version >= 4.2) and uses [npm](https://www.npmjs.com) as package manager.

```
npm install -g botpress
```

## Usage

Creating a bot is simple, simply run [`botpress init`](/docs/cli-reference.md#init) inside an empty directory:

```
mkdir my-bot && cd my-bot
botpress init
```

Once your bot is created, you may [start](/docs/cli-reference.md#start--s) it:

```
botpress start
```

This will provide you with a web interface available at **`http://localhost:3000`**

You then need to install some modules. You can do so directly in the web interface, or using the [`botpress install`](/docs/cli-reference.md#install--i) CLI command:

```
botpress install messenger
```

For a more detailed usage guide, please read the [Basics](/docs/basics.md).

## Documentation

- [Getting Started](/docs/getting-started.md)
- [Basics](/docs/basics.md)
- [Advanced Topics](/docs/advanced-topics.md)
- [CLI Reference](/docs/cli-reference.md)
- [Core Reference](/docs/core-reference.md)

## Examples

There's some tutorial that might help you getting started, it's easy to and it takes about less than 10 minutes.

- [Hello World Bot](https://github.com/botpress/botpress-examples/tree/master/hello-world-bot)
- [Hello World Bot using Rivescript](https://github.com/botpress/botpress-examples/tree/master/hello-world-rivescript-bot)
- [Motivation Bot](https://github.com/botpress/botpress-examples/tree/master/motivation-bot)

There's also some [videos on YouTube](#TODO) that shows how to create and code your bot using Botpress.

- [Getting started](#TODO)
- [Hello World Bot](#TODO)
- Todolist Bot _(soon)_
- Scheduling Messages _(soon)_
- Bot Analytics _(soon)_

Many more code examples are available in the **[Examples repository](https://github.com/botpress/botpress-examples)**

## Community

There's a [public chatroom](https://gitter.im/botpress/core) where you are welcome to join and ask any question and even help others.

## License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.
