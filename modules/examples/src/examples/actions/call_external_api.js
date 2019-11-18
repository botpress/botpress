const axios = require('axios')

/**
 * @title Call an external API
 * @category Tutorial
 * @author Botpress, Inc.
 */
const callApi = async () => {
  // Call the Github API and fetch the latest releases
  const { data } = await axios.get('https://api.github.com/repos/botpress/botpress/releases')

  // Display the latest version in logs
  bp.logger.info(`Latest Botpress version is ${data[0].name}`)

  // You can save the complete response in the session, then use it later
  session.response = data
}

// Actions are async, so make sure to return a promise
return callApi()
