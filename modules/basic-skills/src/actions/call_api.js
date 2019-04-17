const axios = require('axios')
/**
 * @hidden true
 */

const callApi = async (url, method, body, memory, variable, headers) => {
  try {
    const { data } = await axios({
      method,
      url,
      headers,
      data: body
    })
    event.state[memory][variable] = data
    event.state.temp.valid = 'true'
  } catch (error) {
    bp.logger.error(`Error: ${error.response.status || ''} while calling resource "${url}"`)
    event.state.temp.valid = 'false'
  }
}

return callApi(args.url, args.method, args.body, args.memory, args.variable, args.headers)
