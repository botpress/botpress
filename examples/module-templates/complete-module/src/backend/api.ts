import * as sdk from 'botpress/sdk'

export default async (bp: typeof sdk) => {
  /**
   * This is an example route to get you started.
   * Your API will be available at `http://localhost:3000/api/v1/bots/BOT_NAME/mod/complete-module`
   * Just replace BOT_NAME by your bot ID
   */
  const router = bp.http.createRouterForBot('complete-module')

  // Link to access this route: http://localhost:3000/api/v1/bots/BOT_NAME/mod/complete-module/my-first-route
  router.get('/my-first-route', async (req, res) => {
    // Since the bot ID is required to access your module,
    const botId = req.params.botId

    /**
     * This is how you would get your module configuration for a specific bot.
     * If there is no configuration for the bot, global config will be used. Check `config.ts` to set your configurations
     */
    const config = await bp.config.getModuleConfigForBot('complete-module', botId)

    res.sendStatus(200)
  })
}
