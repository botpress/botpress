<a href='http://botpress.io'><img src='https://s3.amazonaws.com/botpress-io/images/screenshot-ui.png'></a>
# [Botpress](https://botpress.io) — The only sane way of building great bots

Botpress is an open-source bot creation tool written in Javascript. It is powered by a rich set of open-source modules built by the community. We like to say that **Botpress is like the Wordpress of Chatbots**; anyone can create and reuse other people's modules.

| 📖 [Documentation](https://docs.botpress.io) | 🍿 [YouTube](https://www.youtube.com/channel/UCEHfE71jUmWbe_5DtbO3fIA) | 🖥 [Website](https://botpress.io) | 💬 [Slack](https://slack.botpress.io) | 📦 [Modules](https://www.npmjs.com/search?q=botpress) | 🚀 [Blog](https://botpress.io/blog) |
| ------------- | ------- | -------- | ------- | -------- | -------- |

⚠️  Make sure you join our [Slack Community](https://slack.botpress.io) for help, announcements, gigs and fun!

## Vision & Mission

Botpress is on a mission to make useful bots ubiquitous by powering developers with the best possible tools to build & manage chatbots. We believe that in order to create great bots, major time should be spent on UX, **not** on the surrounding (and generic) features like Connectors, NLP, Broadcasting, Analytics, Flow and more.

## <a name="what-it-looks-like">What it looks like </a>

<img alt="Botpress" height="150" src="assets/shot_01.png"><img alt="Botpress" height="150" src="assets/shot_02.png"><img alt="Botpress" height="150" src="assets/shot_03.png">

## Getting Started Quickly

The best way to get quickly get started using Botpress is to watch our [video tutorials](https://www.youtube.com/watch?v=HTpUmDz9kRY).

## Installation

Botpress requires [node](https://nodejs.org) (version >= 4.6) and uses [npm](https://www.npmjs.com) as package manager.

```
npm install -g botpress
```

## Creating a bot

Creating a bot is simple, you need to run [`botpress init`](https://docs.botpress.io/getting-started/how-to-use-the-cli.html#init) in a terminal inside an empty directory:

```
botpress init my-bot
```

Once your bot is created, you need to run [`botpress start`](https://docs.botpress.io/getting-started/how-to-use-the-cli.html#start--s) to start your bot:

```
botpress start
```

This will provide you locally a web interface available at **`http://localhost:3000`**

## Adding stuff to your bot

At this point, your bot does nothing, you need to add features. There are two ways to add features:
- Installing modules
- Coding

### Installing modules

For example, there's a `botpress-messenger` module that will make your bot connect to Facebook Messenger and easily send/receive messages.

You can install modules directly in the web interface, or by using the [`botpress install`](https://docs.botpress.io/getting-started/how-to-use-the-cli.html#install--i) command:

```
botpress install messenger
```

Once installed, modules expose two things:
- A graphical interface (available in the left panel). This makes configuration easy and convenient. You don't need to know about coding to use the graphical interface.
- Features via APIs. Each module has a detailed documentation on how to use their API.

### Coding to add features

As the number of modules increase, we expect that the amount of code you'll need to write will lower everyday. Developers can add code directly in the bot (i.e. `index.js`) and access the core and modules features. For example, if you wish to respond to a `GETTING_STARTED` event on Facebook Messenger, you might code something along these lines:

```js
bp.hear({ type: 'postback', text: 'GETTING_STARTED' }, (event, next) => {
  bp.messenger.sendText(event.user.id, 'Hello, human!')
})
```

To create a basic Hello Human bot in 3 minutes, please read the [Getting Started](https://docs.botpress.io/getting-started/).

For learn all about Botpress, please read our full [Documentation](https://docs.botpress.io/)

## Documentation

- [**Hello Human in 3 minutes** (start with this!)](https://docs.botpress.io/getting-started/hello-human-in-3-minutes.html)
- [Getting Started](https://docs.botpress.io/getting-started/)
- [How to create and manage Modules](https://docs.botpress.io/modules/)
- [Creating your bot](https://docs.botpress.io/creating-your-bot/)
- [Management, Monitoring and Deployment](https://docs.botpress.io/managing/)

## Examples

Here are some tutorials that might help you get started. They are easy to follow and take about 10 minutes to work through.

- [Hello World Bot](https://github.com/botpress/botpress-examples/tree/master/hello-world-bot)
- [Hello World Bot using Rivescript](https://github.com/botpress/botpress-examples/tree/master/hello-world-rivescript-bot)
- [Motivation Bot](https://github.com/botpress/botpress-examples/tree/master/motivation-bot)

## Modules

This is a non-exclusive list of modules Botpress has. See [the full list of modules](https://www.npmjs.com/search?q=botpress).

| Module                                                                       | Maintainer
|-----------------------------------------------------------------------------|---------------------------
| **[botpress-wit.ai](https://github.com/botpress/botpress-wit)** | [@danyfs](https://github.com/danyfs)
| **[botpress-subscription](https://github.com/botpress/botpress-subscription)** | [@slvnperron](https://github.com/slvnperron)
| **[botpress-terminal](https://github.com/botpress/botpress-terminal)** | [@slvnperron](https://github.com/slvnperron)
| **[botpress-analytics](https://github.com/botpress/botpress-analytics)** | [@danyfs](https://github.com/danyfs)
| **[botpress-rivescript](https://github.com/botpress/botpress-rivescript)** | [@danyfs](https://github.com/danyfs)
| **[botpress-messenger](https://github.com/botpress/botpress-messenger)** | [@slvnperron](https://github.com/slvnperron)
| **[botpress-slack](https://github.com/botpress/botpress-slack)** | [@danyfs](https://github.com/danyfs)
| **[botpress-discord](https://github.com/TheFreakLord/botpress-discord)** | [@TheFreakLord](https://github.com/TheFreakLord)
| **[botpress-dialog](https://github.com/dialoganalytics/botpress-dialog)** | [@phildionne](https://github.com/phildionne)
| **[botpress-scheduler](https://github.com/botpress/botpress-scheduler)** | [@slvnperron](https://github.com/slvnperron)
| **[botpress-hitl](https://github.com/botpress/botpress-hitl)** | [@danyfs](https://github.com/danyfs)
| **[botpress-botkit](https://github.com/botpress/botpress-botkit)** | [@slvnperron](https://github.com/slvnperron)
| **[botpress-api.ai](https://github.com/botpress/botpress-api.ai)** | [@slvnperron](https://github.com/slvnperron)
| **[botpress-wordhop](https://github.com/wordhop-io/botpress-wordhop)** | [@wordhop-io](https://github.com/wordhop-io)
| **botpress-inspector** | no body yet
| **botpress-transcript** | [@rodrigocnascimento](https://github.com/rodrigocnascimento)
| **botpress-telegram** | no body yet
| **botpress-kik** | no body yet
| **botpress-sms** | no body yet

## Contributing

For starters, there are [some open issues](https://github.com/botpress/botpress/issues?q=is%3Aissue+is%3Aopen+label%3Afor-new-contributors) with the `for-new-contributors` tag which are ideal for starting to contribute. They are all relatively easy to get started with.

If you would like to contribute any new feature or bug fix, please make sure that there is a GitHub issue first. If there is not, simply open one and assign it to yourself. If you are unsure on how to get started, ask us anything in the [Slack](https://slack.botpress.io) or email us at `info [AT] botpress.io`.

Contributions to Botpress will be dual-licensed under AGPLv3 and the Botpress Proprietary License.  This means that all contributors need to agree to the dual-license before their contributions can be accepted.

## Community

There's a [Slack community](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Get an invite and join us now! 👉 [https://slack.botpress.io](https://slack.botpress.io)

## License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way please see the <a href="https://botpress.io/faq">FAQS</a>.

## Credits

Emoji provided free by [EmojiOne](http://emojione.com)
