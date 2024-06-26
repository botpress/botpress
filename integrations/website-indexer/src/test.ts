/* eslint-disable no-console */
import { fetchUrls } from './urlFetcher'

async function main() {
  const rootUrls = [
    'https://www.nytimes.com',
    'https://www.botpress.com',
    'https://sallysbakingaddiction.com',
    'https://www.switchbacktravel.com',
    'https://www.tankarium.com',
    'https://www.loveandlemons.com',
    'https://www.wired.com',
    'https://pagesix.com',
    'https://www.gizmodo.com',
    'https://www.itsalovelylife.com',
    'https://www.smartpassiveincome.com',
    'https://www.theblondesalad.com',
  ]

  const remaining = new Set(rootUrls)

  await Promise.all(
    rootUrls.map(async (url) => {
      console.time(`fetchUrls ${url}`)
      const urls = await fetchUrls(url)
      console.timeLog(`fetchUrls ${url}`, urls.length)
      // console.log(`Fetched ${urls.length} urls from ${url}`)
      remaining.delete(url)
      console.log(`Remaining: [${Array.from(remaining).join(', ')}]`)
    })
  )
}

void main()
