# Introduction to Contributing

:oncoming_police_car: [Ground Rules](#ground-rules)\
:baby: [First-time contributors](#your-first-contribution-in-botpress)\
🏁 [Getting Started](#getting-started)

If you are reading this, you must really like what we are doing and thank you for that. Giving time to a community is the most meaningful way to contribute. In that sense, we want to make sure contributors, maintainers and everyone else working on this project can make the biggest impact possible with the time they have to give.

The following information is here to walk you through your first and future contributions. Following these guidelines also helps to communicate that you respect the time of the developers managing and developing this open-source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Ground Rules

As contributors, you should be respectful and considerate of others - both contributors and non-contributors alike. Please refer to the [code of conduct](./CODE_OF_CONDUCT.md) for our and your responsibilities to the rest of the community.

However, as a reminder, we do have a [Community Forum](https://help.botpress.com/) and a [website](https://botpress.com/), so please use these as places to find support rather than using the issue tracker which should be reserved for feature requests and bug reports.

### New to contributing to open-source?

Working on your first Pull Request? You can learn how from this _free_ series, [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first :smile_cat:

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed and that you need to update your branch so it's easier to merge. Git can be confusing at times, but essentially this means the project history ends up being cleaner - there's an overview of why we might ask you to rebase [here](https://www.atlassian.com/git/tutorials/merging-vs-rebasing).

### Why become a contributor :robot:?

We all have our motivation for doing what we do. For the core team at Botpress, it's our mission; **Making machines understand humans.** Building more intuitive applications using language is why we write lines of code in botpress/v12.

What's your motivation?

- You are looking for experience before finding a job
- You are using the product and you have some idea for improvements.
- You believe in the mission.
- You want to be part of a community of like-minded individuals.

Let us know what motivates you!

### How can you contribute?

Botpress is an open-source project and we welcome any contributions from the community! There are more ways to contribute than fixing bugs and writing features.

- Improving the documentation
- Submitting bug reports
- Writing tutorials
- Organizing meetups
- Supporting the community by answering questions on the forum.

Those are all great contributions and will be welcomed as much as any other.

## Your First Contribution in Botpress

If you're not sure where to start issues, we've labeled some issues with [`good first issue`](https://github.com/botpress/v12/labels/good%20first%20issue), so these are a great place to start!

Start by checking out the [README](./README.md) and check out the introductory videos and get familiar with what Botpress does. Forum, documentation, and tutorials can also be a great starting point and needless to say that they are as essential to the community as any other feature or bug fix.

Side note: There's a _What are you working on?_ topic on our [Forum](https://forum.botpress.com/t/welcome-what-are-you-working-on/2689) so maybe :wave: here and get settled in!

When you are ready to start, go straight to [Getting Started](#getting-started) or [Setting up your local Dev Environment](#setting-up-your-local-dev-environment)

If you do decide to work on an issue, comment saying you intend to pick it up and we'll assign it to you. If you decide it's too much, however, do tell us and we can try to help out or unassign it so it's free for someone else to pick up.

## Getting Started

Contributions to Botpress will be dual-licensed under AGPLv3 and the Botpress Proprietary License. This means that all contributors need to agree to the dual-license before their contributions can be accepted. This is an automatic process when creating the pull-request.

For starters, there are some open issues with the [first good issue][starter-label] tag which are ideal for starting to contribute. They are all relatively easy to get started with.

Please follow the [Conventional Commits](https://conventionalcommits.org/) specs when doing commits. You should also read our [code of conduct](/.github/CODE_OF_CONDUCT.md).

### Your Responsibilities

- Ensure contributions are unit tested and that all tests pass before submitting any pull-request.

  Before you run the tests, you need a PostgreSQL server running on your machine. If you have [Docker](https://www.docker.com/) installed, you can run the following at the command prompt, to automatically download and start a PostgreSQL server. You don't need to understand or install PostgreSQL Server yourself.

  To run local PostgreSQL server at the command prompt.

  ```
  # macOS
  docker run -p 5432:5432 -e POSTGRES_USER=$USER postgres
  # Windows PowerShell
  docker run -p 5432:5432 -e POSTGRES_USER=$env:UserName postgres
  ```

  Note:

  - Press `Ctrl-c` to stop it.

  To run the tests run at the command prompt.

  ```
  npm run test
  ```

- Ensure that the code lints cleanly

  To lint the code run at the command prompt.

  ```
  npm run lint
  ```

- If you do find any issues or think of a feature please [create a Github issue](https://help.github.com/articles/creating-an-issue/) for this first. Discuss things transparently and get community feedback.

### How to Report a Bug

When filing an issue, make sure to answer these five questions:

1. What version of Botpress are you using?
2. What did you do?
3. What did you expect to see?
4. What did you see instead?
5. Any extra detail that might be useful (platform, node version, plugins, etc)

### Submitting Feature Requests

If you find yourself wishing for a feature that doesn't exist in Botpress, you are probably not alone. There are bound to be others out there with similar needs. Many of the features that Botpress has today have been added because our users saw the need. Open an issue on our issues list on GitHub which describes the feature you would like to see, why you need it, and how it should work.

However as Botpress has a great module system consider whether the feature you're requesting would be better as a module, rather than expanding the core platform.

### Commits & Commit Messages

Try to keep the commit message short. Use the notes section if there is any extra detail you want to convey, and keep commits and pull-requests as focussed as possible.

### Reviewing of pull-requests

Pull requests are reviewed as and when the maintainers have the time, however, we may have feedback. Try not to take this as a personal criticism but just an attempt to maintain the quality of the project.

### Setting up Your Local Dev Environment

If you are interested in contributing to Botpress, you will need to create a local development environment. These instructions were tested on macOS using iTerm for CLI.

These instructions assume a parent directory `bar` and we will be adding two child directories: `botpress` and `foobot`.

1. Fork the [botpress repo](https://github.com/botpress/v12) & copy the link. (If you are new to open-source, GitHub, or Git, check out the excellent egghead.io link in 'New to contributing to open-source?' for additional important Git commands, such as checking out a branch, setting your upstream repo, keeping your local copy in sync, and making your pull request).
2. Open a new terminal/CLI tab, and run commands

   ```shell
   # botpress terminal window

   # create and navigate to the `bar` directory
   $ mkdir bar && cd bar
   # Clone the forked repo locally
   bar $ git clone https://github.com/YOURNAME/botpress.git
   ```

3. Continue running commands in the **botpress terminal window**

   ```shell
   # Install Yarn globally
   bar $ npm install --global yarn

   # Navigate to the botpress directory
   bar $ cd botpress

   # Setup the dev environment
   bar/botpress $ yarn install
   bar/botpress $ yarn build

   # Start the botpress server
   bar/botpress $ yarn start
   ```

4. Open a new terminal/CLI tab (**foobot**), and run commands

   ```shell
   # Create our test bot called `foobot`
   bar $ yarn --cwd=botpress run init-foobot

   # Navigate to the foobot directory
   bar $ cd foobot

   # Start the bot normally
   bar/foobot $ bp start
   ```

_Next Steps_

5. You will note that if you want to access the CLI while `botpress` and `foobot` are running, you will need to open a third tab.
6. If you want to confirm that your local copy is working, a straightforward method is to make a change to botpress's React code on your local copy, restart both botpress and foobot

- edit code in botpress
- in: **botpress terminal window**
  ```shell
  # Ctl-C to end watch
  # Start botpress
  bar/botpress $ yarn start
  ```
- in: **foobot terminal window**
  ```shell
  # Ctl-C to stop bot
  bar/foobot $ bp start
  ```
- visit `localhost:3000` in a browser to confirm your change was implemented

### Community

The maintainers and the community members can be found on [the forum](https://forum.botpress.com/) and will try to reply to most messages.
