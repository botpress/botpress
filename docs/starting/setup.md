# Installing the Botpress CLI {#install}

Botpress requires [node](https://nodejs.org) (version >= 4.6) and uses [npm](https://www.npmjs.com) as package manager.

The easiest way to create bots is by using the Botpress CLI. You may install the CLI by running this command in your terminal:

```
npm install -g botpress
```

> **Note**: We recommend using the CLI to create bots and modules, but the CLI is not required for running and deploying bots.

Once installed, make sure that Botpress is well installed. Running the following command should return the version of the CLI tool:

```
botpress --version
```

# Creating a new bot {#new}

Once the CLI is installed, you may create a new bot by running the following command:

```
botpress init name-of-your-bot
```

You'll be prompted by a few questions to assist in the bot creation, then Botpress will proceed to the installation of the required dependencies.

> **Note**: Some people might get errors when running init for the first time. If its the case, go into the directory of the bot that has been created and run `sudo npm install`.

Once done, your bot will be created in the `name-of-your-bot` directory.

# Starting the bot {#start}

At this point, you have a fully working "Hello World" bot sitting in this directory. You may start the bot by running the following command in yout bot's directory:

```
botpress start
```

Then navigate to [localhost](http://localhost:3000) to speak with your bot!

# Next steps {#next}

Your bot currently doesn't do much right now! You must instruct him what to do by writing code. We suggest that you read the [Foundamentals](https://github.com/botpress/botpress/tree/master/docs/foundamentals) section to learn how Botpress works and how you can write a cool bot!
