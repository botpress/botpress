import * as sdk from '@botpress/sdk'

type SlackClient = {
  hasAllScopes: (requiredScopes: string[]) => boolean
}

export const requiresAllScopesDecorator =
  (requiredScopes: [string, ...string[]], operation?: string) =>
  (slackClient: SlackClient, methodName: string, descriptor: PropertyDescriptor): void => {
    const _originalMethod: (...args: unknown[]) => Promise<unknown> = descriptor.value
    descriptor.value = function (...args: unknown[]) {
      if (!slackClient.hasAllScopes.apply(this, [requiredScopes])) {
        throw new sdk.RuntimeError(
          `The Slack access token is missing required scopes to perform operation "${operation ?? methodName ?? descriptor.value?.name}". ` +
            'Please re-authorize the app. \n' +
            `Required scopes: ${requiredScopes.join(', ')}.`
        )
      }
      return _originalMethod.apply(this, args)
    }
  }
