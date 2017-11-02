# Deploying to Heroku

1. Make sure your bot runs locally and that all dependent modules are properly installed and configured.

2. You need a [free Heroku account](https://signup.heroku.com/dc) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed

3. Check package.json to be sure all dependencies are included
  - you can add custom dependencies using `npm install <pkg> --save`
  - If missing, add node version to `packages.json`. We recommend using latest node 8.
  ```javascript
  "engines": {
      "node": ">= 8.0"
    },
  ```
4. Go to Heroku dashboard and make a new app and from there you can follow the instruction to get Botpress on Heroku (`Deploy using Heroku Git`)

5. Setup Postgres 
  - Add a Postgres Database ([Heroku has a free one](https://elements.heroku.com/addons/heroku-postgresql)) to the Heroku App.
  - [Set the env variable](https://devcenter.heroku.com/articles/config-vars) on Heroku `DATABASE=postgres`

6. Setup a password by [setting the env variable](https://devcenter.heroku.com/articles/config-vars) `BOTPRESS_PASSWORD`, e.g. `BOTPRESS_PASSWORD=YoUr_ST0NG-PassWoRD`

You're done! The bot should be running. Please review the following sections for module-specific particularities.

## If deploying a `botpress-messenger` bot

Make sure to set the `MESSENGER_HOST` variable to point to your Heroku app, e.g. `MESSENGER_HOST=yourbot.herokuapp.com`
