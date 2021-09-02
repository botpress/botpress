---
id: version-12.26.0-uipath
title: Using the UiPath integration for Botpress
original_id: uipath
---

**Disclaimer:** This module is currently in **beta**. Breaking changes might appear in the future. Use in production with care.

## About

[UiPath Robotic Process Automation (RPA)](https://www.uipath.com/) is a software technology that makes it easy to build, deploy, and manage software robots that emulate human actions when interacting with digital systems and software. The UiPath module for Botpress allows you to send messages from your UiPath workflows back to your Botpress instance.

## Installation

You must enable the `uipath` module to get started. See [here](../main/module#enabling-or-disabling-modules) to learn how to enable Botpress modules.

## Starting UiPath jobs from Botpress

You can start UiPath jobs from Botpress by leveraging the Botpress SDK and the `Axios library.

Starting a UiPath job is done in 3 steps:

1. Generate an access token to call UiPath
2. Generate a Botpress Token that UiPath will send back to Botpress. This Token is necessary to authenticate calls to send messages back into Botpress.
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
    const { data } = await axios.post(
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
    return data.access_token
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
    const { data } = await axios.get('/mod/uipath/auth/token', axiosConfig)
    return data.token
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
    const { data } = await axios.get(
      `https://platform.uipath.com/${accountLogicalName}/${serviceLogicalName}/odata/Releases`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-UIPATH-TenantName': serviceLogicalName
        }
      }
    )

    const release = data.value.find(
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
    const clientId = '5v7PmPJL6FOGu6RB8I1Y4adLBhIwovQN' // Leave value as-is, do not change

    // Complete the following tutorial: http://dealetech.com/the-definitive-guide-to-uipath-cloud-orchestrator-2019-09-rest-api-authentication/ 
    // This tutorial will help you find the values for the refreshToken, accountLogicalName and serviceLogicalName variables
    const refreshToken = 'N1GNVn4sIqWz4wDMTLUlTdXyMZtYmpBZG_7zN5IYcXhC6' // PLACHOLDER. Replace with your own Refresh Token
    const accountLogicalName = 'botprgaoyxrd' // PLACHOLDER. Replace with your own Account Logical Name
    const serviceLogicalName = 'BotpressDefmqn8231188' // PLACHOLDER. Replace with your own Service Logical Name

    // You need to create a Process in UiPath Orchestrator. More information can be found here: https://docs.uipath.com/orchestrator/docs/about-processes
    const processKey = 'MyProcess' // PLACHOLDER. Replace with your own Process Key
    const processVersion = '1.0.18' // PLACHOLDER. Replace with your own Process Version

    const accessToken = await getAccessToken(clientId, refreshToken)
    const botpressToken = await getBotpressToken()
    const releaseKey = await getReleaseKey(
      accountLogicalName,
      serviceLogicalName,
      accessToken,
      processKey,
      processVersion
    )

    // See https://docs.uipath.com/orchestrator/reference#section-starting-a-job for API reference
    const body = {
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
    }
    const { data, status } = await axios.post(
      `https://platform.uipath.com/${accountLogicalName}/${serviceLogicalName}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs`,
      JSON.stringify(body),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-UIPATH-TenantName': serviceLogicalName
        }
      }
    )

    if (status !== 201) {
      bp.logger.error(status)
      throw `Error from UiPath (${status})`
    }
  }

  return myAction()
  /** Your code ends here */
}
```

## Sending chat messages from UiPath to Botpress

Using the Botpress component for UiPath, you can send back messages from your UiPath workflows to Botpress, enabling you to design UiPath workflows that report back to chat users on the progress of a UiPath Job.

### Installation

From the UiPath Go marketplace, download the Botpress component. Install this component to your UiPath Studio.

### Usage

The Botpress UiPath component contains the `Callback` UiPath Activity. The `Callback` Activity allows your UiPath workflows to send messages back to your Botpress instance.

#### Configuring the Callback Activity

You  can configure the following properties for the `Callback` Activity:

- (REQUIRED) `ExternalURL`: The external URL for your Botpress instance. Examples: `"https://botpress.yourdomain.com"`, `"http://192.168.1.8:3000"`
- (REQUIRED) `Message`: An object representing the message you are sending back to your Botpress instance. Example: `New With {Key .type = "text", Key .text = "Hello, this is a response from UiPath!"}`
- (REQUIRED) `BotId`: The ID for your Botpress chatbot will handle the message. Examples: `"mybot"`, `"hrbot"`
- (REQUIRED) `BotpressToken`: The Botpress Token is required to send back a message to your Botpress instance
- (REQUIRED) `Channel`: The channel on which your bot will send back the message. Examples: `"web"`, `"messenger"`
- (REQUIRED) `Target`: The user ID to which UiPath will send the message. Example: `"Sth3X70cccOkbm-ziPwc"`
