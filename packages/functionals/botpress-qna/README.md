# Botpress Q&A ⚡

Botpress Q&A is a Botpress module that adds the unified Q&A management interface to your bot admin panel.

It relies on the NLU module for recognizing the questions. By default it also uses the `builtins` module to end the text response, but it's configurable (see below).

# Installation

⚠️ **This module only works with the new [Botpress X](https://github.com/botpress/botpress).**

- Install the peer dependencies and the module iteslf `yarn add @botpress/builtins @botpress/nlu @botpress/qna` (note: you can skip the `builtins` module if you use the custom text renderer.)
- Configure [NLU](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-nlu#botpress-nlu-)

# Configuration

The following properties can be configured either in the `qna.json` file or using the environment variables:

| Key | Environment Variable | Required | Default | |
| ------------- | -------- | ----- | ---- | ---- |
| `qnaDir` | `QNA_DIR` | No | `./qna` | The directory where the Q&A data is stored.
| `textRenderer` | `QNA_TEXT_RENDERER` | No | `#builtin_text` (requires `@botpress/builtins` to be installed) | The _renderer_ used to format the text responses.

# Usage

Go to the bot admin panel and choose Q&A from the left hand side menu.

# Contributing

The best way to help right now is by helping with the exising issues here on GitHub and by reporting new issues!

# License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way please see the <a href="https://botpress.io/faq">FAQS</a>.

