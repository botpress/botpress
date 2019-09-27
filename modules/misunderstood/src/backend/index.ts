import * as sdk from "botpress/sdk"

import Db from './db'

const onServerStarted = async (bp: typeof sdk) => { }

const onServerReady = async (bp: typeof sdk) => {
  const db = new Db(bp)
  await db.initialize()
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: "misunderstood-phrases",
    menuIcon: "gesture",
    menuText: "Misunderstood",
    noInterface: false,
    fullName: "Misunderstood Phrases",
    homepage: "https://botpress.io"
  }
}

export default entryPoint
