import { Response, z } from '@botpress/sdk'
import type { VNode } from 'preact'

export type HandlerProps = {
  req: { path: string; query: string; body?: string }
  ctx: {
    webhookId: string
  }
}

export type WizardStep<THandlerProps extends HandlerProps> = {
  id: string
  handler: WizardStepHandler<THandlerProps>
}

export type WizardStepInputProps = {
  selectedChoice?: string
  selectedChoices?: string[]
  inputValue?: string
  formValues?: Record<string, string | number | boolean>
  query: URLSearchParams
  responses: {
    redirectToStep: (stepId: string) => Response
    redirectToExternalUrl: (url: string) => Response
    displayChoices: (props: {
      pageTitle: string
      htmlOrMarkdownPageContents: string
      choices: { label: string; value: string }[]
      nextStepId: string
      multiple?: boolean
      defaultValues?: string[]
    }) => Response
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
    }) => Response
    displayInput: (props: {
      pageTitle: string
      htmlOrMarkdownPageContents: string
      input: {
        label: string
        type: 'text' | 'number' | 'email' | 'password' | 'url'
      }
      nextStepId: string
    }) => Response
    displayForm: <T extends z.ZodObject>(props: {
      pageTitle: string
      htmlOrMarkdownPageContents: string
      schema: T
      nextStepId: string
      errors?: z.ZodError<z.input<T>>
      previousValues?: z.input<T>
    }) => Response
    displayCustom: (props: { pageTitle: string; body: VNode }) => Response
    endWizard: (result: { success: true } | { success: false; errorMessage: string }) => Response
  }
}

export type WizardStepHandler<THandlerProps extends HandlerProps> = (
  props: THandlerProps & WizardStepInputProps
) => Response | Promise<Response>
