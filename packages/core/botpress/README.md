<a href='http://botpress.io'><img src='https://raw.githubusercontent.com/botpress/botpress/master/.github/assets/botpress_xl.gif'></a>

# [Botpress](https://botpress.io) — The open-source bot platform

[![CircleCI](https://circleci.com/gh/botpress/botpress.svg?style=svg)](https://circleci.com/gh/botpress/botpress)
[![npm](https://img.shields.io/npm/v/botpress.svg)](https://www.npmjs.com/package/botpress)

Botpress is an open-source bot creation tool written in JavaScript. It is powered by a rich set of open-source modules built by the community. We like to say that **Botpress is like the WordPress of Chatbots**; anyone can create and reuse other people's modules.

##### Learn Botpress

| 📖 [v10 **Documentation**](https://botpress.io/docs) |
| ---------------------------------------------------- |


##### Follow us

| 🖥 [Website](https://botpress.io) | 💬 [Slack](https://slack.botpress.io) | 🚀 [Blog](https://botpress.io/blog) | 🐥 [Twitter](https://twitter.com/getbotpress) |
| -------------------------------- | ------------------------------------- | ----------------------------------- | --------------------------------------------- |


---

👉 Make sure you join our [Slack Community](https://slack.botpress.io) for help, announcements, gigs and fun!

## Support the project ⭐

If you feel awesome and want to support us in a small way, please consider starring and sharing the repo! This helps us getting known and grow the community. 🙏

<img alt="Botpress" width="250" src=".github/assets/star_us.gif">

## What is Botpress

Botpress is on a mission to make useful bots ubiquitous by powering developers with the best possible tools to build & manage chatbots. We believe that in order to create great bots, significant time should be spent on user experience, **not** on the surrounding (and generic) features.

<img alt="Botpress" height="150" src=".github/assets/shot_01.png"><img alt="Botpress" height="150" src=".github/assets/shot_02.png"><img alt="Botpress" height="150" src=".github/assets/shot_03.png">

## Installation

Botpress requires [Node.js](https://nodejs.org) (version >= 8.2) and uses [npm](https://www.npmjs.com) as package manager.

```
npm install -g botpress
```

## Creating a bot

Creating a bot is simple, you need to run [`botpress init`](https://botpress.io/docs/reference/cli.html#init) in a terminal inside an empty directory:

```
botpress init my-bot
```

Once your bot is created, you need to run [`botpress start`](https://botpress.io/docs/reference/cli.html#start) to start your bot:

```
botpress start
```

This will provide you with a web interface available at **`http://localhost:3000`** and a chat window at **`http://localhost:3000/s/chat`**

## Contributing

Thank you for your interest in Botpress. Here are some of the many ways to contribute.

* Check out our [contributing guide](/.github/CONTRIBUTING.md)
* Check misspelling in our docs.
* Look at our [code of conduct](/.github/CODE_OF_CONDUCT.md)
* Engage with us on Social Media
  * Follow us on [Twitter](https://twitter.com/getbotpress)
* Answer and ask questions on the [Forum](https://help.botpress.io/)

For starters, there are some open issues with the [first good issue][starter-label] tag which are ideal for starting to contribute. They are all relatively easy to get started with.

Contributions to Botpress will be dual-licensed under AGPLv3 and the Botpress Proprietary License. This means that all contributors need to agree to the dual-license before their contributions can be accepted.

Please follow the [Conventional Commits](https://conventionalcommits.org/) specs when doing commits. **Pull requests not respecting this commit style will be rejected.**

## Development steps

To modify, test or create modules, please install [lerna](https://github.com/lerna/lerna).

Then run `lerna bootstrap`. This will initialize all modules and link them (using `yarn link`). Then in your bot, use `yarn link @botpress/module-name` to use the local version of that module.

## License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way, please see the <a href="https://botpress.io/faq">FAQS</a>.

## Credits

Emoji provided free by [EmojiOne](http://emojione.com)

[starter-label]: https://github.com/botpress/botpress/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22
