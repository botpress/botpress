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
      // This function replaces the property descriptor (the class method) with
      // a new function. Within the context of this function, `this` refers to
      // the instance of the class (SlackClient) where the method is defined.

      // We use .apply and .call to ensure that instance methods are attached to
      // the actual instance of SlackClient.

      if (!slackClient.hasAllScopes.apply(this, [requiredScopes])) {
        const grantedScopes = slackClient.getGrantedScopes.call(this)
        const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope))

        throw new sdk.RuntimeError(
          `The Slack access token is missing required scopes to perform operation "${operation ?? methodName ?? descriptor.value?.name}". ` +
            'Please re-authorize the app. \n\n' +
            `Scopes required for this operation: ${requiredScopes.join(', ')}. \n` +
            `Missing scopes: ${missingScopes.join(', ')}. \n` +
            `Scopes granted to the app: ${grantedScopes.join(', ')}.`
        )
      }
      return _originalMethod.apply(this, args)
    }
  }
