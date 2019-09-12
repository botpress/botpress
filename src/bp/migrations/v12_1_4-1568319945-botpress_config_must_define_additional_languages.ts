import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'
import Joi from 'joi'

const migration: Migration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const botpressConfig = await configProvider.getBotpressConfig()
    const extraLangs = botpressConfig.additionalLanguages

    const validateLanguages = (languages: any) => {
      const { error } = Joi.validate(
        languages,
        Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            code: Joi.string().required()
          })
        )
      )
      return error
    }

    const err = validateLanguages(extraLangs)
    if (Array.isArray(extraLangs) && err) {
      return {
        success: false,
        message: 'AdditionalLanguages are not in a valid format, please modify botpress.config.json'
      }
    }

    if (extraLangs === undefined) {
      await configProvider.mergeBotpressConfig({ additionalLanguages: [] })
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
