import * as sdk from '@botpress/sdk'

type SlackClient = {
  hasAllScopes: (requiredScopes: string[]) => boolean
  getGrantedScopes: () => Readonly<string[]>
}

export const requiresAllScopesDecorator =
  (requiredScopes: [string, ...string[]], operation?: string) =>
  (slackClient: SlackClient, methodName: string, descriptor: PropertyDescriptor): void => {
    const _originalMethod: (...args: unknown[]) => Promise<unknown> = descriptor.value
    descriptor.value = function (...args: unknown[]) {
      if (!slackClient.hasAllScopes.apply(this, [requiredScopes])) {
        const grantedScopes = slackClient.getGrantedScopes()
        const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope))

        throw new sdk.RuntimeError(
          `The Slack access token is missing required scopes to perform operation "${operation ?? methodName ?? descriptor.value?.name}". ` +
            'Please re-authorize the app. \n\n' +
            `Scopes required for this operation: ${requiredScopes.join(', ')}. \n` +
            `Missing scopes: ${missingScopes.join(', ')}. \n` +
            `Scopes granted to the app: ${slackClient.getGrantedScopes().join(', ')}.`
        )
      }
      return _originalMethod.apply(this, args)
    }
  }
