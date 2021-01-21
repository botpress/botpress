<a href='https://botpress.com/?utm_source=github&utm_medium=organic&utm_campaign=botpress_repo&utm_term=readme'><img src='.github/assets/train_bar.gif'></a>

# [Botpress](https://botpress.com/?utm_source=github&utm_medium=organic&utm_campaign=botpress_repo&utm_term=readme) — The open-source Virtual Assistant platform

[![CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiNTZoU0wzRmRQd29iWTFqVjliUzlvN0gzUUtoN25QVHlHMUhWYkZCWHpPQ3ZKQzFOMFh6Wm5EcHkxQW5SUmJuTFpLSDJXdURDVzNtRjM5d1BaU2pNUHhJPSIsIml2UGFyYW1ldGVyU3BlYyI6Iitoa0RBM091SnlXNTJwK2MiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://console.aws.amazon.com/codesuite/codebuild/projects/botpress-ce-tests/history?region=us-east-1)

Botpress is an open-source all-in-one bot creation platform that provides all the tools you need to build, debug and deploy AI-based conversational assistants. Built-in channels include:

- Facebook Messenger
- Slack
- Microsoft Teams
- Skype
- Website (Webchat)
- Telegram

Botpress is:

- Developer-focused
- Natural Language Understanding (NLU)
- Built-in graphical interface & flow editor
- Administration panel and bot management tools
- Runs fully on-prem (control your data)
- Support multiple messaging channels such as Webchat, SMS, Telegram, Facebook Messenger etc

---

##### Learn Botpress

| 📖 [**Documentation**](https://botpress.com/docs) | 🍿 [**Tutorials**](https://www.youtube.com/c/botpress) | 💘 [**Community Forum**](https://forum.botpress.com) |
| ------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |


## Deploy in the Cloud

Botpress can be easily deployed on DigitalOcean as a 1-Click App [here](https://marketplace.digitalocean.com/apps/botpress).

[![DigitalOcean](.github/do_button.svg)](https://marketplace.digitalocean.com/apps/botpress)

Botpress can also be deployed for free on Heroku. However, this is not the most optimal botpress experience, you may want to host your own [language server](https://botpress.com/docs/advanced/hosting#running-your-own-language-server)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Deploy using Binaries

You can download the binaries [here](https://botpress.com/download?utm_source=github&utm_medium=organic&utm_campaign=botpress_repo&utm_term=readme).

## Building from source

**Prerequisites**: Node 12.13 (you can use [nvm](https://github.com/creationix/nvm)) and Yarn.

1. Run `yarn` to fetch node packages.
1. Run `yarn build` to build the core, the UI and the modules.
1. Run `yarn start` to start the server.

<details><summary><strong>Building Issues</strong></summary>
<p>

If you encounter errors when building modules (timeout, random errors, etc), try the following:

1. Go in each module folder and type `yarn && yarn build`

</p>
</details>

## Contributing

Here are some of the many ways to contribute.

- Contribute code by reading our [contributing guide](/.github/CONTRIBUTING.md)
- Fix spelling mistakes and amend the [documentation](/docs/guide/docs)
- Answer and ask questions on the [Forum](https://forum.botpress.com/)

For starters, there are some open issues with the [first good issue][starter-label] tag which are ideal for starting to contribute. They are all relatively easy to get started with.

Contributions to Botpress will be dual-licensed under AGPLv3 and the Botpress Proprietary License. This means that all contributors need to agree to the dual-license before their contributions can be accepted.

Please follow the [Conventional Commits](https://conventionalcommits.org/) specs when doing commits. You should also read our [code of conduct](/.github/CODE_OF_CONDUCT.md).

## License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way, please see the <a href="https://botpress.com/faq">FAQS</a>.

## Botpress Partners

Botpress Partners is a list of agencies who can help you build your next conversational assistant.

| Agency Name                                     | Location                            |
| ----------------------------------------------- | ----------------------------------- |
| [Okam](https://okam.ca/)                        | Montreal, Canada                    |
| [Lampyon](https://www.lampyon.com/)             | Toronto, Canada & Budapest, Hungary |
| [Smile](https://www.smile.eu)                   | Asnières-sur-Seine, France          |
| [Solvative](https://solvative.com/)             | Kansas City, KS & New York, NY, USA |
| [ZeroBulb](https://www.zerobulb.com)            | Kerala, India                       |
| [Tasqat](https://www.tasqat.com)                | Dubai, United Arab Emirates         |
| [Creative Melon](https://creativemelon.co.za)   | Johannesburg, South Africa          |
| [PaperGo](https://www.papergo.io)               | Patras, Greece                      |
| [BotArtisanz](http://botartisanz.com/)          | Kerala, India                       |
| [DevSamurai](https://www.devsamurai.com/)       | Tokyo, Japan                        |
| [Teplar Solutions](https://www.teplar.com)      | Coimbatore, Tamil Nadu, India       |
| [SabanaTech](https://www.sabanatech.com)        | San José, Costa Rica, Latin America |
| [Specloid Solutions](https://www.specloid.com/) | Bengaluru, Karnataka, India         |

_If you are an agency and would like to be on this list, please clone the repository & add your agency to the list in the README.md. Then, you can create a pull request on the repository and we'll make sure to review and merge your PR swiftly._
