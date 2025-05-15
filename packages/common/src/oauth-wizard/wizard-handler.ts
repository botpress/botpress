import * as sdk from '@botpress/sdk'
import * as htmlDialogs from '../html-dialogs'
import * as consts from './consts'
import type * as types from './types'

export class OAuthWizard<THandlerProps extends types.HandlerProps> {
  private readonly _steps: Map<string, types.WizardStep<THandlerProps>>
  private readonly _handlerProps: THandlerProps

  public constructor({
    steps,
    handlerProps,
  }: {
    steps: Map<string, types.WizardStep<THandlerProps>>
    handlerProps: THandlerProps
  }) {
    this._steps = steps
    this._handlerProps = handlerProps
  }

  public async handleRequest(): Promise<sdk.Response> {
    if (!isOAuthWizardUrl(this._handlerProps.req.path)) {
      throw new sdk.RuntimeError('Invalid OAuth wizard URL')
    }

    const searchParams = new URLSearchParams(this._handlerProps.req.query)
    const stepId = this._handlerProps.req.path.slice(consts.BASE_WIZARD_PATH.length)
    const step = this._steps.get(stepId)

    if (!step) {
      throw new sdk.RuntimeError(`Unknown step ID: ${stepId}`)
    }

    return await step.handler({
      ...this._handlerProps,
      query: searchParams,
      selectedChoice: searchParams.get(consts.CHOICE_PARAM) ?? undefined,
      responses: {
        displayButtons: ({ buttons, pageTitle, htmlOrMarkdownPageContents }) =>
          htmlDialogs.generateButtonDialog({
            pageTitle,
            helpText: htmlOrMarkdownPageContents,
            buttons: buttons.map((button) => ({
              type: button.buttonType ?? 'primary',
              label: button.label,
              ...(button.action === 'close'
                ? { closeWindow: true }
                : button.action === 'navigate'
                  ? { navigateTo: getWizardStepUrl(button.navigateToStep, this._handlerProps.ctx) }
                  : button.action === 'external'
                    ? { navigateTo: new URL(button.navigateToUrl) }
                    : { navigateTo: new URL(`javascript:${button.callFunction}()`) }),
            })),
          }),
        displayChoices: ({ choices, nextStepId, pageTitle, htmlOrMarkdownPageContents }) =>
          htmlDialogs.generateSelectDialog({
            formFieldName: consts.CHOICE_PARAM,
            formSubmitUrl: getWizardStepUrl(nextStepId, this._handlerProps.ctx),
            pageTitle,
            helpText: htmlOrMarkdownPageContents,
            options: choices.map((choice) => ({
              label: choice.label,
              value: choice.value,
            })),
          }),
        redirectToStep: (stepId) => htmlDialogs.generateRedirection(getWizardStepUrl(stepId, this._handlerProps.ctx)),
        redirectToExternalUrl: (url) => htmlDialogs.generateRedirection(new URL(url)),
        endWizard: (result) =>
          htmlDialogs.generateRedirection(
            _getInterstitialUrl(result.success, result.success ? undefined : result.errorMessage)
          ),
      },
    })
  }
}

export const getWizardStepUrl = (stepId: string, ctx?: { webhookId: string }): URL =>
  new URL(`${consts.BASE_WIZARD_PATH}${stepId}${ctx ? `?state=${ctx.webhookId}` : ''}`, process.env.BP_WEBHOOK_URL)

export const isOAuthWizardUrl = (path: string): path is (typeof consts)['BASE_WIZARD_PATH'] =>
  path.startsWith(consts.BASE_WIZARD_PATH)

const _getInterstitialUrl = (success: boolean, message?: string) =>
  new URL(
    process.env.BP_WEBHOOK_URL?.replace('webhook', 'app') +
      `/oauth/interstitial?success=${success}${message ? `&errorMessage=${message}` : ''}`
  )
