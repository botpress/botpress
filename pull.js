const Axios = require('axios')
const tar = require('tar')
const stream = require('stream')
const fs = require('fs')

//TODO remove this, for testing purpose
const HOST = 'http://localhost:3000'
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTQ3MjM5Njc5LCJleHAiOjE1NDcyNjEyNzksImF1ZCI6IndlYi1sb2dpbiJ9.7utAIEuMhYU2CqUM2bCi-J2sAsyXoWa88OED4gSugB0'
const TARGET = 'test-extract'

const extractToDir = async (archive, target) => {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }
  const buffStream = new stream.PassThrough()
  const tarWriteStream = tar.x({ sync: true, strict: true, cwd: target })

  buffStream.end(archive)
  buffStream.pipe(tarWriteStream)

  return new Promise((resolve, reject) => {
    tarWriteStream.on('finished', resolve)
    tarWriteStream.on('error', reject)
  })
}

const pull = async (host, token, target) => {
  const options = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: "arraybuffer"
  }

  // TODO handle error properly, make it beautiful
  const res = await Axios.get(`${host}/api/v1/admin/versioning/export`, options)

  return extractToDir(res.data, target)
}

pull(HOST, TOKEN, TARGET).then(() => {
  console.log("done")
}).catch(err => {
  console.log('error', err)
})