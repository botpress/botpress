const axios = require('axios')

const callApi = async (url, method, body) => {
  console.log(url, method, body)

  const client = axios.create({
    baseURL: url
  })

  let response = undefined

  if (method === 'get') {
    response = await client.get('/').then(res => res.data)
  } else if (method === 'post') {
    if (body) {
      response = await client.post('/', body).then(res => res.data)
    }
  } else if (method === 'put') {
    if (body) {
      response = await client.put('/', body).then(res => res.data)
    }
  } else if (method === 'delete') {
    response = await client.delete('/').then(res => res.data)
  }

  temp.callApiResponse = response
}

return callApi(args.url, args.method, args.body)
