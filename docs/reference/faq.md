# FAQ

## When conversations are initiated responses don't automatically go into that conversation thread?

Check order of middleware: conversations should be on top of hear

## Where can I find Botpress documentation?
https://botpress.io/docs/

## When I copy-paste tutorial code for modules it doesn't load the custom modules. 
>When I copy-paste the tutorial code it hasn't installed in botpress? It only loads the web and platform-webchat modules, but not the custom module?

# Answer
In OSx the webpack doesnt compile the module, so you must do a npm run compile in your custome module.

For more information on how to create modules in Botpress: https://botpress.io/docs/modules/

## When do you use bp.hear and bp.convo ? Can you hear user inputs in bp.convo?
When do you use bp.hear and bp.convo ? Can you hear user inputs in bp.convo?

# Answer
Yes you can. `bp.convo` is made exactly for that. Consider the case where you want to get the user's name and email. You can't use `bp.hear` for this because it won't work as it should. 

## When conversations are initiated responses don't automatically go into that conversation thread?
# Answer
Check order of middleware: conversations should be on top of hear.

## What would you recommend hosting the bot?
# Answer
Heroku, its pretty straightforward to link your github through.
Discussion: [link](https://botpress-community.slack.com/archives/C3TUSNHQU/p1515900827000029).

## What setup do you use to develop your facebook bot locally?
> The chat emulator does not seem to have support for quick replies?

# Answer 
Try to use plain ol messenger. It's tedious, but unless you want to develop for web chat, that seems to be the go-to platform.

## What is the difference between index.js and rivescript?
> they seem to be competing for attention.  I really like the typing: true feature in `index.js`, but can `rivescript` do similar?

# Answer
`index.js` is the backbone of your bot. `rivescript` is just for the logic of your bot... I mean for conversation stuffs.

## What happens if I close the terminal and Botpress turns off?
When you close the terminal on which you started your local botpress instance, you are effectively 'terminating' that instance, this is why botpress turns off. You will have to set it up as a daemon or service. It is recommended to PM2 or “forever” to run botpress as a deamon.

## What command creates the bot on windows node terminal ?
# Answer
`bp init` or `botpress init`

## Use content.yml with Slack buttons (SUGGESTION)
While it is posible to render slack buttons with the slack connector, it is 


https://api.slack.com/docs/message-buttons

[How to attach slack buttons in a message from a content.yml template]

```welcome: 
  - text: Let's get started
    buttons: 
      - <VALUEPROP> Let's go!
      - <DASHBOARD> Actuallyt, let's check the dashboard first
      - <TIMELINE> How does the timeline for my project look like?
```

## Nested Persistent Menus on Messenger?
> Not sure how to do this with the Menu Builder on Botpress Messenger

# Answer
You can create your own persistent menu by editing `botpress-messenger.config.xml`. 

## Is there any common way to bring some variety to one content path ?
# Answer
Yes. You can write various replies in your `content.yml` and the bot returns them randomly. It's an effective way of randomizing your responses. 

For more: https://botpress.io/docs/foundamentals/umm/#toc-cool-how-do-i-use-it

## Is there a bp-twilio connector? 
# Answer
There is a bp-twilio module. `botpress-twilio`, however, it is still in beta. 

## Is there a botpress command for compiling es6 in the index.js folder or must you setup own webpack configuration?
>Is there a botpress command for compiling es6 in the index.js folder or do you need to setup your own webpack configuration?

# Answer
You can use Gulp and Babel for that. You set it up manually in your botpress project. Example: 

```
pipe(babel({
                "presets": [
                    "es2015"
                ],
                "plugins": [
                    ["typecheck", {
                        "disable": {
                            "production": true
                        }
                    }], "syntax-flow", "transform-flow-strip-types"]
            })
        )`
```

## Is it possible to have multiple Content files for the UMM? 
>Is it possible to have multiple Content files for the UMM? ie 2 separate yml files in the same folder?

# Answer
Point your botfile section for content to a folder instead of a file ie './content/, then you can have multiple files inside the one folder, to access your replies on a file called 'smalltalk.yml' you put `event.reply('#smalltalk.your_reply'`

## Integration with RASA_NLU, the text is not matching and going to fallback block.
# Answer
Connection refuses error, if you are running the RASA server in a different system. Change the URL in botpress-rasa_nlu node module configuration, from localhost to the exact IP address and it should work. 

For more help on Botpress and Rasa: https://www.patreon.com/posts/15681962

## I've installed the platform-webchat module, but need the script to make it run. 
> I've installed the platform-webchat module, but I don't have the script that I have to insert in my web to run. 
# Answer
Try this: 
https://github.com/botpress/botpress-platform-webchat#web-view-embedded-on-websites

## I unchecked test mode from messenger menu, but my bot still wont speak up with other people, why is that?
# Answer
You need to verify the bot with facebook before it starts to talk with others.

## I have issues building botpress on ubuntu
>I am getting this error:
```
const copyEmailTemplates = async () => {
                                 ^

SyntaxError: Unexpected token (
    at createScript (vm.js:56:10)
    at Object.runInThisContext (vm.js:97:10)
    at Module._compile (module.js:542:28)
    at Object.Module._extensions..js (module.js:579:10)
    at Module.load (module.js:487:32)
    at tryModuleLoad (module.js:446:12)
    at Function.Module._load (module.js:438:3)
    at Module.runMain (module.js:604:10)
    at run (bootstrap_node.js:383:7)
    at startup (bootstrap_node.js:149:9)
```

When running:

` node ./build.js`

# Answer
Try to update node.js.  It must be later than 7.x to support async

## I can't get botpress to work locally anymore? 
> I can't seem to get botpress to work locally anymore? I  keep getting this error:
```
ERR! Tried to download(403): https://mapbox-node-binary.s3.amazonaws.com/sqlite3/v3.1.8/node-v59-darwin-x64.tar.gz
```

# Answer
If you have installed botpress before or nodejs, you may have to  uninstall both and re-install nodejs. Here are some more details on how to uninstall: https://stackoverflow.com/questions/11177954/how-do-i-completely-uninstall-node-js-and-reinstall-from-beginning-mac-os-x/11178106#11178106

## I am getting an OAuth Error
> I am getting this error: `OAuth Error: redirect_uri did not match any configured URIs.`

# Answer
You can find answer in the error message. The redirect URL needs to be configured on the Oauth page of your slack app. 

## How to use botpress broadcasting to send a FB carousel? 
>How do you use  botpress broadcasting to send a FB carousel? I don’t know how to broadcast templates to my subscribed users using botpress GUI. 

# Answer
Use the botpress function `bp.messenger.sendTemplate()`

## How to to expose rest endpoint on Botpress express server?
> How to expose rest endpoint on Botpress express server? Do I have a way to access the express app? https://github.com/botpress/botpress/blob/master/docs/modules/api.md

# Answer 
`const router = bp.getRouter('botpress-whatever-you-want')`

`router.get('/awesome/stuff', (req, res) => { })`

## How to run multiple instance of my bot?
# Answer
It should be possible to run multiple instances of your bot, each having different configs to listen to multiple pages.

## How to remove the "Hello, human" when I first click on "get_started" in messenger ? 
> Even with my `bp.hear(/GET_STARTED/ in index.js` it writed both "Hello, human" and my chosen message.

# Answer
Check your greeting message on the Botpress-Messenger tab in Botpress.

## How to make the bp.Hear listen out to the response from quick reply buttons
> The event works as I can type the word it is listening out for, but when it is from a button it doesn't work. 

# Answer
This should help: https://botpress.io/examples/fb_send_qr

## How to make my database communicate with Postgres database? 
> I am trying to use a database on postgres. On the postgres database I have already built my database.  How do i make it communicate with the postgres database?
# Answer
https://botpress.io/docs/foundamentals/database/#toc-using-postgres-on-heroku-heroku

## How to maintain session variables?
# Answer 
Use Key Value Stores to maintain variables. 

## How to integrate a chatbot with a database.
# Answer
https://botpress.io/docs/advanced/database_helpers/

## How to install npm (Node Package Manager) to botpress without internet
# Answer
Download the botpress repo from github and then install it on PC without internet connectivity. 

On PC having internet connectivity
1. `git clone <botpress-repo>`
2. cd botpress
3. npm install
4. npm run compile
5. npm pack

Copy the generated tar file to the PC with no connectivity
Run `npm install -g <generated_tar_file> `

## How to get botpress working on heroku?
# Answer
This guide should help: 
https://botpress.io/docs/deploy/heroku/

## How to feed variables or array of variables  with SQL select query?
> I succeeded in connecting to Postgres and execute a select query but I don't know how to get the results back. I think it would be around Promise or call backs but I don't know how to translate knex syntax into botpress (e.g. additional "var => syntax").  

# Answer
Botpress suggest you use the KVS for storing simple data structures. It's much easier. Otherwise you can ES6 await/async and do the following:

```
const knex = await bp.db.get()
const brands = (await knex('phone_brand').select('brand').then()).map(row => row.brand
```

## How to extract what a person says to the bot and use it in the event
# Answer
```
bp.hear(/^[A-Z]{3}[0-9]{4}[A-Z0-9]{4}/i, event => {
    event.reply('#welcome')
    console.log(event.text)
```

## How to do a POST request after an answer from user?
# Answer
Try to use request from NPM (npm install request --save), then on the answer use the request.post method to post the variable to the API. 

## How to address default fallback
# Answer
> For those curious about having a default fallback this should work: 
```
bp.fallbackHandler = async (event, next) => {
    if (/text|message/i.test(event.type)) {
      bp.logger.warn('[FALLBACK] Phrase: ' + event.text)
      event.reply('#default.fallback')
  }
}
```

## How to access the same convo across multiple calls to the bot
> I use this example: https://botpress.io/examples/fb_convo_simple.  It will find the convo when I call it the _second_ time but it always creates the convo from scratch?

# Answer
It must use threads to keep the convo going.

## How do you update a user picture in the database? 
> How do you update a user picture in the database? The picture URL that I have in my database is not available anymore. 
# Answer
It's not possible to a update user profile picture from the bot. You will have to get the users profile picture again, and replace in the database. 

## How do you tackle a date picker for a booking bot? 
# Answer
Use web view. After user selects date, use `Messenger.requestCloseBrowser()`, grab the user PSID, then send a message to the user automatically, to continue the booking.

## How do I update the botpress and messenger modules to its latest versions?
# Answer
`npm install botpress / npm install botpress-messenger `

Dont forget to add the --save flag

## How can you share messenger bot while the FB app is in development stage?
> Currently only I can chat with it. I want to share link with a concerned party (similar to alpha launch).

# Answer
You can assign roles to your FB app in developer section (ie developers.facebook.com). This is where you can assign testers, etc.

## Error when trying to transpile index.js file (entry point to the app) and running the server
> I am trying to transpile my index.js file which is the entry point to the app. When I run the server, I get the following error: *The bot entry point must be a function that takes an instance of bp*

# Answer
If you are using a webpack with Botpress, then it might be due to how webpack outputs the transpiled version. Try to reconfigure the  webpack. 

## Can someone please let me know how to change the image carousel to square image ?
# Answer
`image_aspect_ratio: square`

## Can I pick up changes on index.js without having to restart?
>Each time I make a change to my bot I need to restart the botpress app. Is there a way i can pick up changes on index.js without having to restart?

In package file, add in scripts a command `botpress start --watch` and in the console start this command:

Example: package.json

```
 "scripts": {
    "start": "botpress start",
    "dev": "botpress start --watch",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```

Console:  `npm run dev`

So when you change a js file, botpress will restart automatically.

## Can botpress  be restarted automatically on script change?
> I am looking for something similar to nodemon…restarting server on script change.

# Answer
Try running it with the --watch flag `bp s --watch`

## botpress-messenger module requires https connection between facebook api and my bot
> Just pushed my bot on a server accessible with a public ip with something like `196.x.x.x:3000 `and it worked. The only matter that I have is about the botpress-messenger module which require a "https" connection between Facebook api and my bot, which failed.

# Answer
You can create a SSL certificate on your server using LetsEncrypt and get a free domain for 12 months from freenom.com. Setting it up all together will solve your issue.

Discussion: https://botpress-community.slack.com/archives/C3TUSNHQU/p1516425099000055).

## Bot deployed and connected to the FB page but unable to answer to any incoming message (SUGGESTION)
>I have followed the steps in the Botpress documentation, deployed with Heroku and connected it my Facebook page with no connection errors. But when I test it by sending the bot a message it doesn't answer?
I have sent it to Facebook for review and they replied to me saying there is an error on the API `Send (pages_messaging).`

## Bad indentation of a sequence entry
> Does anyone know why I getting the error "bad indentation of a sequence entry" when I trying to implement this example (https://botpress.io/examples/fb_send_list)? This example is in the official Botpress website and I had copied exactly the same code

# Answer
This just means you need to check your indentation structuring in your `content.yml` file for this section. Make sure it is nested correctly for the response.

## "An error occured during communication with Facebook "self signed certificate in certificate chain"
> Messenger webhook connect error "An error occured during communication with Facebook "self signed certificate in certificate chain"" what is happening here

# Answer
I've found the reason of the problem and fixed, it was  network problem of hosting.

## "Add Content" button is disabled in Content Manager
# Answer
You have to create a category first before you can add content. 

Here is the documentation: https://botpress.io/docs/en/docs/foundamentals/content/#toc-creating-a-category

## How to enable triggers for broadcasts. 
>Is there a feature in botpress that enables triggers for broadcasts? We are trying to build a bot that utilizes the 24-hour window Facebook allow you to connect with people who started a conversation with the bot.

# Answer
Use the `botpress-subscription` and `botpress-audience` module

##  How do I use Botpress and Rasa? 
# Answer
Perhaps this guide can be helpful:
https://geekedoutsolutions.com/build-chatbot-using-rasa-botpress/

## Is it possible to connect the same bot logic to different facebook pages at once? 
# Answer
I don't think you'll be able to connect the same bot instance to multiple pages, however you could link the same dialogflow across multiple apps.

Discussion: [link](https://botpress-community.slack.com/archives/C3TUSNHQU/p1515973282000103).

## Is it possible to create a follow-up intent yes no in combination with quick replies?
# Answer
Yes.... Check out private replies from the docs on https://developer.facebook.com.

Discussion: [link](https://botpress-community.slack.com/archives/C3TUSNHQU/p1511918425000244?thread_ts=1511902067.000028&cid=C3TUSNHQU).

## Is it possible to send a fb message when a user comments on the page post?
# Answer
Yes.... Check out private replies from the docs on https://developer.facebook.com.

Discussion: [link](https://botpress-community.slack.com/archives/C3TUSNHQU/p1511918425000244?thread_ts=1511902067.000028&cid=C3TUSNHQU).