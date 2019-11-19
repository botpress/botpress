const axios = require('axios')

/**
 * @title Call an external API
 * @category Tutorial
 * @author Botpress, Inc.
 */
const callApi = async () => {
  // Call the Github API and fetch the latest releases
  const { data } = await axios.get('https://api.github.com/repos/botpress/botpress/releases')

  // The first element returned is the most recent release
  const mostRecentRelease = data[0]

  const latestVersion = mostRecentRelease.name
  const releaseNotesUrl = mostRecentRelease.html_url

  // Display the latest version in logs
  bp.logger.info(`Latest Botpress version is ${latestVersion}`)

  // Prepare the message
  const message = {
    type: 'text',
    text: `Latest version: **${latestVersion}**\n\n[View release notes](${releaseNotesUrl})`,
    // Markdown enables rich content, for example links or bold text. Otherwise, content will be displayed as-is
    markdown: true
  }

  // Send the message to the user (note the array, since you can send multiple payloads in the same reply)
  await bp.events.replyToEvent(event, [message])

  // You could also save the complete response in the session, then use it later
  session.response = data
}

// Actions are async, so make sure to return a promise
return callApi()
