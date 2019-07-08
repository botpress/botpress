<a href='http://botpress.io'><img src='.github/assets/train_bar.gif'></a>

# [Botpress](https://botpress.io) — The open-source bot platform

[![CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiNTZoU0wzRmRQd29iWTFqVjliUzlvN0gzUUtoN25QVHlHMUhWYkZCWHpPQ3ZKQzFOMFh6Wm5EcHkxQW5SUmJuTFpLSDJXdURDVzNtRjM5d1BaU2pNUHhJPSIsIml2UGFyYW1ldGVyU3BlYyI6Iitoa0RBM091SnlXNTJwK2MiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://console.aws.amazon.com/codesuite/codebuild/projects/botpress-ce-tests/history?region=us-east-1)

Botpress is an open-source all-in-one bot creation platform that provides all the tools you need to build, debug and deploy AI-based conversational assistants.

- Developer-focused
- Natural Language Understanding (NLU)
- Built-in graphical interface & flow editor
- Administration panel and bot management tools
- Runs fully on-prem (control your data)
- Support multiple messaging channels such as Webchat, SMS, Telegram, Facebook Messenger etc

---

<a href='http://botpress.io'><img src='.github/assets/banner.gif'></a>

##### Learn Botpress

| 📖 [v12 **Documentation**](https://botpress.io/docs) | 🍿 [**YouTube Channel**](https://www.youtube.com/c/botpress) |
| ---------------------------------------------------- | ------------------------------------------------------------ |


##### Follow us

| 🖥 [Website](https://botpress.io) | 💬 [Community](https://help.botpress.io) | 🚀 [Blog](https://botpress.io/blog) | 🐥 [Twitter](https://twitter.com/getbotpress) |
| -------------------------------- | ---------------------------------------- | ----------------------------------- | --------------------------------------------- |


## Support the project ⭐

If you feel awesome and want to support us in a small way, please consider starring and sharing the repo! This helps us get visability and allow the community to grow. 🙏

<img alt="Botpress" width="250" src=".github/assets/star_us.gif">

## Pre-built Binaries

You can download the binaries [here](https://s3.amazonaws.com/botpress-binaries/index.html).

## Building from source

**Prerequisites**: Node 10.11 (you can use [nvm](https://github.com/creationix/nvm)) and Yarn.

1. Run `yarn` to fetch node packages.
1. Run `yarn build` to build the core, the UI and the modules.
1. Run `yarn start` to start the server.

### Building issues

If you encounter errors when building modules (timeout, random errors, etc), try the following:

1. Go in each module folder and type `yarn && yarn build`

## Documentation

### Developer's Guide

We use [Docusaurus](https://docusaurus.io/en/) to create the Developer's Guide.

- To start the development server, run `yarn start:guide`
- To generate the static files, run `yarn build:guide`. The generated files will appear under `/docs/guide/build`
- To deploy a new version of the documentation, run `yarn run version <version here>`

### SDK Reference

We use [TypeDoc](https://github.com/TypeStrong/typedoc) to generate the SDK Reference directly from the source code.

- Run `yarn build:reference` to generate the documentation. The static files will appear under `/docs/reference/public`.

## Contributing

Thank you for your interest in Botpress. Here are some of the many ways to contribute.

- Check out our [contributing guide](/.github/CONTRIBUTING.md)
- Check misspelling in our docs.
- Look at our [code of conduct](/.github/CODE_OF_CONDUCT.md)
- Engage with us on Social Media
  - Follow us on [Twitter](https://twitter.com/getbotpress)
- Answer and ask questions on the [Forum](https://help.botpress.io/)

For starters, there are some open issues with the [first good issue][starter-label] tag which are ideal for starting to contribute. They are all relatively easy to get started with.

Contributions to Botpress will be dual-licensed under AGPLv3 and the Botpress Proprietary License. This means that all contributors need to agree to the dual-license before their contributions can be accepted.

Please follow the [Conventional Commits](https://conventionalcommits.org/) specs when doing commits. **Pull requests not respecting this commit style will be rejected.**

## License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way, please see the <a href="https://botpress.io/faq">FAQS</a>.
