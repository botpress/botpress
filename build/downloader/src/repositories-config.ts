import path from 'path'

export interface RepositoriesConfig {
  [repoName: string]: {
    favorites?: string[]
    dotEnvFile?: {
      location: string
      content: string
    }
  }
}

export const getConfig = (rootFolder: string): RepositoriesConfig => {
  return {
    botpress: {
      favorites: [
        path.resolve(rootFolder, 'botpress/packages/bp/dist/data'),
        path.resolve(rootFolder, 'botpress/packages/bp/dist/.env'),
        path.resolve(rootFolder, 'botpress/packages/bp/dist/data/global/botpress.config.json')
      ],
      dotEnvFile: {
        location: path.resolve(rootFolder, 'botpress/packages/bp/dist/'),
        content: `### Linked Repositories
DEV_STUDIO_PATH=${rootFolder}/studio/packages/studio-be/out
DEV_NLU_PATH=${rootFolder}/nlu/packages/nlu-cli/dist
DEV_MESSAGING_PATH=${rootFolder}/messaging/packages/server/dist

### Connections
# DATABASE_URL=postgres://user:pw@localhost:5432/dbname
# BPFS_STORAGE=database
# CLUSTER_ENABLED=true
# REDIS_URL=redis://localhost:6379
# BP_REDIS_SCOPE=
# MESSAGING_ENDPOINT=http://localhost:3100
# NLU_ENDPOINT=http://localhost:3200

### Server Setup
# BP_PRODUCTION=true
# PRO_ENABLED=true
# EXTERNAL_URL=http://localhost:3000
# BP_CONFIG_HTTPSERVER_PORT=3000
# BP_CONFIG_PRO_LICENSEKEY=your_license
# DEBUG=bp:*

### Migrations
# AUTO_MIGRATE=true
# TESTMIG_ALL=true
# TESTMIG_NEW=true

### Sandbox
# DISABLE_GLOBAL_SANDBOX=true
# DISABLE_BOT_SANDBOX=true
# DISABLE_TRANSITION_SANDBOX=true
# DISABLE_CONTENT_SANDBOX=true`
      }
    },

    messaging: {
      favorites: [path.resolve(rootFolder, 'messaging/packages/server/dist/.env')],
      dotEnvFile: {
        location: path.resolve(rootFolder, 'messaging/packages/server/dist/'),
        content: `
### Connections
# DATABASE_URL=postgres://user:pw@localhost:5432/dbname
# CLUSTER_ENABLED=true
# REDIS_URL=redis://localhost:6379
# REDIS_SCOPE=

### Server Setup
# EXTERNAL_URL=https://something.ngrok.io
# LOGGING_ENABLED=true`
      }
    },

    studio: {
      favorites: [path.resolve(rootFolder, 'studio/packages/studio-be/out/.env')],
      dotEnvFile: {
        location: path.resolve(rootFolder, 'studio/packages/studio-be/out/'),
        content: `
### Connections
# DATABASE_URL=postgres://user:pw@localhost:5432/dbname
# BPFS_STORAGE=database
# CLUSTER_ENABLED=true
# REDIS_URL=redis://localhost:6379
# BP_REDIS_SCOPE=
# NLU_ENDPOINT=http://localhost:3200

### Server Setup
# PROJECT_LOCATION=
# BP_DATA_FOLDER=
# EXTERNAL_URL=http://localhost:3000`
      }
    },

    nlu: {
      favorites: [path.resolve(rootFolder, 'nlu/config.json')]
    }
  }
}
