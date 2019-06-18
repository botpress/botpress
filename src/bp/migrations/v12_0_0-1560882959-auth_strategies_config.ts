import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { Migration } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Adds default strategy to Botpress config & updates super admins',
    type: 'config'
  },
  up: async (bp: typeof sdk, configProvider: ConfigProvider): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    const hasAuthStrategy = config.authStrategies && Object.keys(config.authStrategies).length
    const hasCollabStrategy = config.pro.collaboratorsAuthStrategies && config.pro.collaboratorsAuthStrategies.length

    if (hasAuthStrategy && hasCollabStrategy) {
      return { success: true, message: `Auth Strategies already configured, skipping...` }
    }

    await configProvider.mergeBotpressConfig({
      pro: {
        collaboratorsAuthStrategies: ['default']
      },
      authStrategies: {
        default: {
          type: 'basic',
          allowSelfSignup: false,
          options: {
            maxLoginAttempt: 0
          }
        }
      },
      // @ts-ignore Typing is off since the signature has changed
      superAdmins: config.superAdmins.map(email => ({ email, strategy: 'default' }))
    })

    return { success: true }
  }
}

export default migration
