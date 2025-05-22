import * as sdk from '@botpress/sdk'

export type HandlerProps = {
  req: { path: string; query: string }
  ctx: {
    webhookId: string
  }
}

export type WizardStep<THandlerProps extends HandlerProps> = {
  id: string
  handler: WizardStepHandler<THandlerProps>
}

export type WizardStepHandler<THandlerProps extends HandlerProps> = (
  props: THandlerProps & {
    selectedChoice?: string
    query: URLSearchParams
    responses: {
      redirectToStep: (stepId: string) => sdk.Response
      redirectToExternalUrl: (url: string) => sdk.Response
      displayChoices: (props: {
        pageTitle: string
        htmlOrMarkdownPageContents: string
        choices: { label: string; value: string }[]
        nextStepId: string
      }) => sdk.Response
      displayButtons: (props: {
        pageTitle: string
        htmlOrMarkdownPageContents: string
        buttons: ({
          label: string
          buttonType?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info'
        } & (
          | { action: 'navigate'; navigateToStep: string }
          | { action: 'external'; navigateToUrl: string }
          | { action: 'javascript'; callFunction: string }
          | { action: 'close' }
        ))[]
      }) => sdk.Response
      endWizard: (result: { success: true } | { success: false; errorMessage: string }) => sdk.Response
    }
  }
) => sdk.Response | Promise<sdk.Response>
