<a href='http://botpress.io'><img src='/assets/screenshot-ui.png'></a>
# <a href='http://botpress.io'><img src='https://httpsimage.com/img/botpress-logo-120.png' height='60'></a>

Botpress is an open-source bot creation tool written in Javascript. It is powered by a rich set of open-source (and proprietary) modules built by the community. In fact, Botpress helps you to build easily awesome chatbots by using modules and by being able to customize anything you want to. Developers will now have total over the development of their bots!

## ALPHA TESTERS

Important: **Make sure to join the official Facebook Group (https://www.facebook.com/groups/656491441198667/)!**

## Vision & Mission

Botpress is on mission to make bots ubiquitous and profitable for everybody. At Botpress, we think that using close source building tools like ChatFuel is not the right way to build awesome and powerful chatbots. To be able to create something **great**, it's important to have full control over your chatbots ant it's exactly what Botpress offers you!   

## Target audience

Botpress is at an early stage and we are looking for **node developers** to build new modules, create chatbots and help the community to build something that will be **huge**... Over time, everyone will benefits to have a powerful open-source tool that helps to build easily and quickly chatbots by using a wide variety of specialized modules.

## Installation

Botpress requires [node](https://nodejs.org) (version >= 4.2) and uses [npm](https://www.npmjs.com) as package manager.

```
npm install -g botpress
```

## Usage

Creating a bot is simple, you simply need to run [`botpress init`](/docs/cli-reference.md#init) in command line inside an empty directory:

```
mkdir my-bot && cd my-bot
botpress init
```

Once your bot is created, you need to [start](/docs/cli-reference.md#start--s) it:

```
botpress start
```

This will provide you locally a web interface available at **`http://localhost:3000`**

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

There's also some [videos on YouTube](https://www.youtube.com/channel/UCEHfE71jUmWbe_5DtbO3fIA) that shows how to create and code your bot using Botpress.

- [Create a Facebook Messenger chatbot in 3 minutes](https://www.youtube.com/watch?v=GO2yJ51ILl0)
- Todolist Bot _(soon)_
- Scheduling Messages _(soon)_
- Bot Analytics _(soon)_

Many more code examples are available in the **[Examples repository](https://github.com/botpress/botpress-examples)**

## Community

There's a [public chatroom](https://gitter.im/botpress/core) where you are welcome to join and ask any question and even help others.

## License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.
