const axios = require('axios')

/**
 * @hidden true
 */
const check_agents = async event => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  const { data } = await axios.get('/mod/hitlnext/agents', axiosConfig)

  temp['hitlnext-noAgent'] = data.filter(x => x.online).length === 0
}

return check_agents(event)
