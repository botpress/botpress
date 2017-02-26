# How to deploy to Heroku

1. Set up botpress locally with all the dependent modules installed and configured
  * (if using messenger module) make sure you disable Ngork before uploading to heroku

2. You need a [free Heroku account](https://signup.heroku.com/dc) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed

3. Check package.json to be sure all dependencies are included
  1. you can add custom dependencies using `npm install <pkg> --save`
  2. Add node version to `packages.json`
	```javascript
	"engines": {
	    "node": "7.1.0"
	  },
	```

4. Specifying a start script [Procfile](https://devcenter.heroku.com/articles/procfile) or make sure you have the start script in your packages.json


  * So your final package.json should look something like this:

    ```javascript
    {
      "name": "AwsomeBot",
      "version": "0.0.1",
      "description": "botishness",
      "main": "index.js",
      "dependencies": {
        "botpress": "0.x",
        "botpress-analytics": "^1.0.7",
        "botpress-hitl": "0.0.1",
        "botpress-messenger": "^1.0.16",
        "botpress-scheduler": "^1.0.1",
        "botpress-subscription": "^1.0.2"
      },
      "scripts": {
        "start": "botpress start",
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "author": "sbeta",
      "license": "AGPL-3.0",
      "engines": {
        "node": ">6.0.0"
      }
    }

    ```


5. Try it locally and see if it works: `heroku local web`

6. Go to Heroku dashboard and make a new app and from there you can follow the instruction to get botpress on heruko `Deploy using Heroku Git`

7. Go to Heroku dashboard -> Settings and in the Config Variables section add a password for your dashboard:
    ```
    BOTPRESS_PASSWORD : <YOUR_ST0nG_PasSwoRd>
    ```