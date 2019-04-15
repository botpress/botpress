const axios = require('axios')

/**
 * @hidden true
 */
const callApi = async (url, method, body, memory, variable) => {
  const client = axios.create({
    baseURL: url
  })

  let response = undefined
  if (method === 'get') {
    response = await client.get('/').then(res => res.data)
  } else if (method === 'post') {
    response = await client.post('/', body).then(res => res.data)
  } else if (method === 'put') {
    response = await client.put('/', body).then(res => res.data)
  } else if (method === 'delete') {
    response = await client.delete('/').then(res => res.data)
  }

  event.state[memory][variable] = response
}

return callApi(args.url, args.method, args.body, args.memory, args.variable)
