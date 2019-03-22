import * as sdk from 'botpress/sdk'
import Database from './db'
import api from './api'

const onServerStarted = async (bp: SDK) => {
  let db = new Database(bp)
  await db.initialize()
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'registry-books',
    menuIcon: 'library_books',
    menuText: 'Registry Books',
    fullName: 'Registry Books',
    homepage: 'https://botpress.io',
    noInterface: false,
  }
}

export default entryPoint