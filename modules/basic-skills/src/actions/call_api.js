const axios = require('axios')
/**
 * @hidden true
 */

const callApi = async (url, method, body, memory, variable, headers) => {
  // Use context to flatten event object
  const context = {
    event,
    user: event.state.user,
    temp: event.state.temp,
    session: event.state.session
  }
  const renderedHeaders = bp.cms.renderTemplate(headers, context)
  const renderedBody = bp.cms.renderTemplate(body, context)
  const keySuffix = args.randomId ? `_${args.randomId}` : ''

  try {
    const response = await axios({
      method,
      url,
      headers: renderedHeaders,
      data: renderedBody
    })

    event.state[memory][variable] = { body: response.data, status: response.status }
    event.state.temp[`valid${keySuffix}`] = true
  } catch (error) {
    const errorCode = (error.response && error.response.status) || error.code || ''
    bp.logger.error(`Error: ${errorCode} while calling resource "${url}"`)

    event.state[memory][variable] = { status: errorCode }
    event.state.temp[`valid${keySuffix}`] = false
  }
}

return callApi(args.url, args.method, args.body, args.memory, args.variable, args.headers)
