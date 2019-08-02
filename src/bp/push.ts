import axios from 'axios'
import chalk from 'chalk'

export default async ({ url, authToken }) => {
  if (!url || !authToken) {
    console.log(chalk.red(`${chalk.bold('Error:')} parameters are not valid.`))
    return
  }

  url = url.replace(/\/+$/, '')
  console.log('Creating backup of staged files.')
  console.log('Pushing your local data folder.')

  await push(url, authToken)
}

async function push(baseUrl: string, token: string): Promise<void> {
  const options = {
    headers: { Authorization: `Bearer ${{ token }}` }
  }

  try {
    await axios.post(`${baseUrl}/api/v1/admin/versioning/push`, options)
  } catch (err) {
    throw Error(`Couldn't export, server responded with \n ${err.response.status} ${err.response.statusText}`)
  }
}
