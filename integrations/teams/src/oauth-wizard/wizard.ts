import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z, type Response } from '@botpress/sdk'
import { credentialsSchema } from 'definitions'
import { validateCredentials } from '../credentials'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const _credentialsForm = {
  pageTitle: 'Microsoft Teams Setup',
  htmlOrMarkdownPageContents:
    'Enter the App ID, App Password, and Tenant ID from your Azure Bot Framework registration.',
  schema: credentialsSchema,
  nextStepId: 'save-credentials',
}

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'save-credentials', handler: _saveCredentialsHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => responses.displayForm(_credentialsForm)

const _saveCredentialsHandler: WizardHandler = async ({ ctx, client, logger, formValues, responses }) => {
  try {
    if (!formValues) {
      return responses.redirectToStep('start')
    }

    const parsed = credentialsSchema.safeParse(formValues)
    if (!parsed.success) {
      return responses.displayForm({
        ..._credentialsForm,
        errors: parsed.error,
        previousValues: formValues as z.input<typeof credentialsSchema>,
      })
    }

    try {
      await validateCredentials(parsed.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid Microsoft Teams credentials'
      const syntheticParse = credentialsSchema.safeParse({})
      if (!syntheticParse.success) {
        syntheticParse.error.issues = [{ message, path: ['appPassword'], code: 'custom' } satisfies z.ZodIssue]
        return responses.displayForm({
          ..._credentialsForm,
          errors: syntheticParse.error,
          previousValues: parsed.data,
        })
      }
      // Should never reach here since empty object fails validation
      return responses.endWizard({ success: false, errorMessage: message })
    }

    await client.setState({
      type: 'integration',
      name: 'credentials',
      id: ctx.integrationId,
      payload: parsed.data,
    })
    await client.configureIntegration({ identifier: parsed.data.appId })

    return responses.endWizard({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    logger.forBot().error(`Teams wizard step failed: ${message}`, { error })
    return responses.endWizard({ success: false, errorMessage: message })
  }
}
