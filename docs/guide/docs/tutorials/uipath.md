---
id: uipath
title: Using the UiPath integration for Botpress
---

**Disclaimer:** This module is currently in **beta**. Breaking changes might appear in the future. Use in production with care.

## About

The UiPath module for Botpress allows you to receive messages

https://github.com/botpress/BotpressUiPath

## Installation

You must enable the `uipath` module in order to get started. See [here](../main/module#enabling-or-disabling-modules) to learn how to enable Botpress modules.

## Starting UiPath jobs from Botpress

You can start UiPath jobs from Botpress by leveraging the Botpress SDK and the `axios` library.

Calling UiPath is done in 3 steps:

1. Generate an access token to call UiPath
2. Generate a Botpress Token that UiPath will send back to Botpress
3. Start a UiPath Job

Here is an example of starting a UiPath job using a Botpress Action:

```js
async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  const axios = require('axios')

  /**
   * Generates a UiPath Access Token
   *
   * @param clientId The UiPath Client ID
   * @param refreshToken The UiPath Refresh Token. See https://postman.uipath.rocks/?version=latest to learn how to generate a Refresh Token
   * @return The UiPath Access Token
   */
  const getAccessToken = async (clientId, refreshToken) => {
    const tokenResponse = await axios.post(
      'https://account.uipath.com/oauth/token',
      JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return tokenResponse.data.access_token
  }

  /**
   * Generates a Botpress Token for the Botpress UiPath module
   *
   * @return A Botpress Token
   */
  const getBotpressToken = async () => {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    axiosConfig.params = {
      expiresIn: '1h' // expiresIn is optional. Increase it for longer running jobs. See here for examples https://github.com/zeit/ms#examples
    }
    const resp = await axios.get('/mod/uipath/auth/token', axiosConfig)
    const { token } = resp.data
    return token
  }

  /**
   * Finds the Release Key for a given UiPath Process
   *
   * @param accountLogicalName The UiPath Account Logical Name
   * @param serviceLogicalName The UiPath Service Logical Name
   * @param accessToken The UiPath Access Token. Use the getBotpressToken() to generate a UiPath Access Token.
   * @param processKey The UiPath Process Key. For example, "MyProcess".
   * @param processKey The UiPath Process Version. For example, "1.10.13".
   * @return The Release Key for the given UiPath Process
   */
  const getReleaseKey = async (accountLogicalName, serviceLogicalName, accessToken, processKey, processVersion) => {
    const resp = await axios.get(
      `https://platform.uipath.com/${accountLogicalName}/${serviceLogicalName}/odata/Releases`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-UIPATH-TenantName': serviceLogicalName
        }
      }
    )

    const release = resp.data.value.find(
      release => release.ProcessKey === processKey && release.ProcessVersion === processVersion
    )
    return release.Key
  }

  /**
   * Starts a UiPath Job using the UiPath Orchestrator
   * @title Start UiPath Job
   * @category UiPath
   * @author Botpress
   */
  const myAction = async () => {
    const clientId = '6v7PmPJL6FOGu6RB8I1Y4adLXhIwovQN'
    const refreshToken = 'N1GNVn4sIqWz4wDMTLUlTdXyMZtYmpBZG_7zN5IYcXhC6'
    const accountLogicalName = 'botprgaoyxrd'
    const serviceLogicalName = 'BotpressDefmqn8231188'
    const processKey = 'MyProcess'
    const processVersion = '1.0.18'

    const accessToken = await getAccessToken(clientId, refreshToken)
    const botpressToken = await getBotpressToken()
    const releaseKey = await getReleaseKey(
      accountLogicalName,
      serviceLogicalName,
      accessToken,
      processKey,
      processVersion
    )

    const { data, status } = await axios.post(
      `https://platform.uipath.com/${accountLogicalName}/${serviceLogicalName}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs`,
      JSON.stringify({
        startInfo: {
          ReleaseKey: releaseKey,
          Strategy: 'All',
          RobotIds: [],
          NoOfRobots: 0,
          InputArguments: JSON.stringify({
            channel: event.channel,
            target: event.target,
            botId: event.botId,
            botpressToken
          })
        }
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-UIPATH-TenantName': serviceLogicalName
        }
      }
    )

    if (status !== 201) {
      throw `Error from UiPath (${status})`
      console.log(data)
    }
  }

  return myAction()
  /** Your code ends here */
}
```

## Sending chat messages from UiPath to Botpress
