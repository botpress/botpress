export interface Config {
    /**
     * If the channel is enabled for the bot (this config file must be
     * in the data/bots/BOT_ID/config folder)
     * @default false
     */
    enabled: boolean

    /**
     * This is the value of the Bot Id required for an app to ignore
     * messages from itself.
     * @default your_bot_id
     */
    botId: string

    /**
     * The value of Signing Secret on page Basic Information.
     * @default signin_secret
     */
    signingSecret: string

    /**
     * Url to receive slack events and interactions.
     * @default /slack/events
     */
    eventsUrl: string

    /**
     * The duration of the authentication session when a user
     * authenticates through this channel.
     * @default 24h
     */
    chatUserAuthDuration: string

    /**
     * Type of app. Can be 'single' for Single Workspace apps or
     * 'multiple' for Multiple Workspaces Apps.
     * @default multiple
     */
    type: 'single' | 'multiple'

    /**
     * This is the value of "Bot User OAuth Access Token" on the page
     * OAuth & Permissions. Only required when using the single
     * workspace installation.
     */
    botToken?: string

    /**
     * The value of Client ID on page Basic Information. Only required
     * when using the multiple workspace installation.
     * @default client_id
     */
    clientId?: string

    /**
     * The value of Client Secret on page Basic Information. Only required
     * when using the multiple workspace installation.
     * @default client_secret
     */
    clientSecret?: string

    /**
     * The secret to use when installing the app. Only required
     * when using the multiple workspace installation.
     * @default state_secret
     */
    stateSecret?: string

    /**
     * The scopes required for the installation. Only required when
     * using the single workspace installation.
     * @default ["channels:history", "chat:write", "im:history", "users:read"]
     */
    scopes?: Array<string>

    /**
     * Url that Slack uses to redirect users after they complete your
     * app’s installation flow. Only used for the multiple workspace
     * installation.
     * @default /slack/redirect
     */
    redirectUrl?: string

    /**
     * Url for “Add to Slack” button. Only used for the multiple
     * workspace installation.
     * @default /slack/installApp
     */
    installUrl?: string

    /**
     * The url to an endpoifnt where an installation link will be
     * generated. Only used for the multiple workspace installation.
     * The endpoint will respond to any GET request:
     * {
     *     installUrl: 'some installation url'
     * }
     * @default /slack/installUrl
     */
    installUrlEndpoint?: string

    /**
     * The url where the user will be redirected upon successful
     * installation of the app. If no value is provided, a default
     * success page will be loaded. Only used for the multiple
     * workspace installation.
     * Use the following params in URL: {appId}, {team.id} or {installation}
     * @example http://my-awesome-app.com/successfull-installation?base64_encoded_installation={installation}
     * @example https://app.slack.com/client/{team.id}
     * @default null
     */
    successRedirectUrl?: string

    /**
     * The url where the user will be redirected upon installation
     * failure of the app. If no value is provided, a default failure
     * page will be loaded. Only used for the multiple workspace
     * installation.
     * Use the following params in URL: {appId}, {team.id} or {installation}
     * @example http://my-awesome-app.com/failure-installation
     * @default null
     */
    failureRedirectUrl?: string
}
