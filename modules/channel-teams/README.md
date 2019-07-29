Follow these instruction to use the Botpress Teams channel:

1. First read the official: [Microsoft bot framework documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/bots/bots-create)

2. Try deploying an echo bot from the official [Microsoft bot framework samples](https://github.com/microsoft/BotBuilder-Samples). Don't dig to far in the sdk as Botpress handle this part of the logic.

Once that you are familiar with Azure, that you've registered a Microsoft App Id and a password (sometimes called secret) and that you've achieved interacting with your deployed bot on MS Teams:

3. Enable the channel-teams module in:

   > data/global/botpress.config.json

4. Create the following file:

   > data/bots/YOUR_BOT_ID/config/channel-teams.json

5. Write the following content in the file:

   ```
   {
     "enabled": true,
     "microsoftAppId": "YOUR APP ID",
     "microsoftAppPassword": "YOUR APP PW"
   }
   ```

You should be able to use your bot just like the sample bot you created and deployed at step 2.
