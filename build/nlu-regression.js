const http = require('http')
const fs = require('fs')

const repoRootDir = `${__dirname}/..`
const nluTestingDir = `${repoRootDir}/modules/nlu-testing/`

const host = '127.0.0.1'
const port = '3000'

const buildRequest = (options, resolve, reject) => {
  return http.request(options, function(res) {
    res.setEncoding('utf8')

    let receivedData = ''
    res.on('data', function(chunk) {
      receivedData += chunk
    })
    res.on('error', function(err) {
      reject(err)
    })
    res.on('end', function() {
      resolve(receivedData)
    })
  })
}

const post = async (path, content, headers) => {
  const post_options = {
    host,
    port,
    path,
    method: 'POST',
    headers,
    timeout: 2000
  }
  return new Promise(function(resolve, reject) {
    const post_req = buildRequest(post_options, resolve, reject)
    post_req.write(content)
    post_req.end()
  })
}

const get = async (path, headers) => {
  const get_options = {
    host: '127.0.0.1',
    port: '3000',
    path,
    method: 'GET',
    headers
  }
  return new Promise(function(resolve, reject) {
    const get_req = buildRequest(get_options, resolve, reject)
    get_req.end()
  })
}

const login = async () => {
  const data = 'email=admin&password=123456'
  const rawLogin = await post('/api/v1/auth/login/basic/default', data, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data)
  })
  const login = JSON.parse(rawLogin)

  const token = login.payload && login.payload.token
  return login.statusCode ? undefined : token
}

const signup = async () => {
  const data = 'email=admin&password=123456'
  const rawLogin = await post('/api/v1/auth/register/basic/default', data, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data)
  })
  const login = JSON.parse(rawLogin)

  const token = login.payload && login.payload.token
  return login.statusCode ? undefined : token
}

const createBot = async (botId, token) => {
  const newBot = JSON.stringify({
    id: botId,
    name: 'testy',
    template: {
      id: 'bp-nlu-regression-testing',
      moduleId: 'nlu-testing'
    },
    category: undefined
  })

  await post('/api/v1/admin/bots', newBot, {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(newBot),
    'X-BP-Workspace': 'default'
  })
}

const waitForTraining = async (botId, token) => {
  return new Promise(function(resolve) {
    let i = 0
    console.log(`training...`)
    const intervalId = setInterval(async () => {
      const raw = await get(`/api/v1/bots/${botId}/mod/nlu/train`, {
        Authorization: `Bearer ${token}`
      })
      const trainingStatus = JSON.parse(raw)
      if (!trainingStatus.isTraining) {
        clearInterval(intervalId)
        resolve()
      } else {
        console.log(`training... ${2 * ++i}s`)
      }
    }, 2000)
  })
}

const round = (n, acc) => {
  const num = Math.pow(10, acc)
  return Math.round(n * num) / num
}

const runAllTests = async (botId, token) => {
  const baseNluTesting = `/api/v1/bots/${botId}/mod/nlu-testing`
  const rawTests = await get(`${baseNluTesting}/tests`, {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  })
  const allTests = JSON.parse(rawTests)
  const nTests = allTests.length
  let nPassing = 0

  let i = 0
  for (const test of allTests) {
    const retry = () =>
      post(`${baseNluTesting}/tests/${test.id}/run`, '', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })

    let rawResult
    try {
      rawResult = await retry()
    } catch (err) {
      console.error(err, 'retrying')
      rawResult = await retry()
    }

    const testResult = JSON.parse(rawResult)
    nPassing += testResult.success ? 1 : 0
    console.log(`(${i++} /${nTests}) #${test.id}`, 'success: ', testResult.success)
  }

  const acc = (nPassing / nTests) * 100
  return round(acc, 1)
}

const compareScore = async score => {
  const latestResultsFile = `${nluTestingDir}/src/bot-templates/bp-nlu-regression-testing/latest-results.csv`
  const latestResultsContent = fs.readFileSync(latestResultsFile, { encoding: 'utf8' })
  const previousScoreOccurence = latestResultsContent.match(/summary: ((100|\d{1,2})[.]\d{1})?/gm)
  if (!previousScoreOccurence || !previousScoreOccurence[0]) {
    return false
  }

  const previousScoreString = previousScoreOccurence[0].split(':')[1]
  const previousScore = parseFloat(previousScoreString)
  console.log('previous score was: ', previousScore)

  return score >= previousScore
}

const main = async () => {
  try {
    let token = await login()
    if (!token) {
      token = await signup()
    }
    if (!token) {
      console.error('Unable to login and sign up...')
      process.exit(1)
    }

    const botId = 'testy'

    await createBot(botId, token)
    await waitForTraining(botId, token)
    console.log('training done!')

    const score = await runAllTests(botId, token)
    console.log('score: ', score)

    const testPasses = await compareScore(score)
    if (!testPasses) {
      console.error('There seems to be a regression on NLU BPDS...')
      process.exit(1)
    }

    console.log('No regression noted!')
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
main()
