import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    
    // Validate API key is provided and not empty
    const apiKey = ctx.configuration.apiKey as unknown as string
    if (!apiKey || typeof apiKey !== 'string') {
      throw new sdk.RuntimeError('API Key is required for Gatewayz integration')
    }
    if (apiKey.trim().length === 0) {
      throw new sdk.RuntimeError('API Key cannot be empty')
    }

    // Validate base URL format if provided
    const baseUrl = ctx.configuration.baseUrl as string | undefined
    if (baseUrl && typeof baseUrl !== 'string') {
      throw new sdk.RuntimeError('Base URL must be a valid string')
    }
    
    if (baseUrl) {
      try {
        new URL(baseUrl)
      } catch (error) {
        throw new sdk.RuntimeError('Invalid base URL format. Please provide a valid URL (e.g., https://gatewayz-app.vercel.app)')
      }
    }

    // Test API connectivity using health check
    try {
      const normalizedBaseUrl = (baseUrl && typeof baseUrl === 'string' ? baseUrl.replace(/\/$/, '') : 'https://gatewayz-app.vercel.app')
      const healthUrl = `${normalizedBaseUrl}/health`
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new sdk.RuntimeError(`Gatewayz API is not accessible. Status: ${response.status}. Please check your base URL and ensure the service is running.`)
      }

      const healthData = await response.json() as { status?: string }
      if (!healthData || healthData.status !== 'healthy') {
        throw new sdk.RuntimeError('Gatewayz API health check failed. The service may be experiencing issues.')
      }

    } catch (error) {
      if (error instanceof sdk.RuntimeError) {
        throw error
      }
      throw new sdk.RuntimeError(`Failed to connect to Gatewayz API: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test API key authentication with a protected endpoint
    try {
      const normalizedBaseUrl = (baseUrl && typeof baseUrl === 'string' ? baseUrl.replace(/\/$/, '') : 'https://gatewayz-app.vercel.app')
      const profileUrl = `${normalizedBaseUrl}/user/profile`
      
      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      })

      // If we get 401, the API key is invalid
      if (response.status === 401) {
        throw new sdk.RuntimeError('Invalid API key. Please check your Gatewayz API key and try again.')
      }

      // If we get 403, the API key doesn't have required permissions
      if (response.status === 403) {
        throw new sdk.RuntimeError('API key does not have required permissions. Please ensure your API key has access to user profile endpoints.')
      }

      // For other errors, we'll allow the integration to be registered but log the issue
      if (!response.ok && response.status !== 404) {
        logger.forBot().warn(`Gatewayz API returned status ${response.status} during authentication test. Integration will be registered but some features may not work.`)
      }

    } catch (error) {
      if (error instanceof sdk.RuntimeError) {
        throw error
      }
      logger.forBot().warn(`Could not verify API key authentication: ${error instanceof Error ? error.message : 'Unknown error'}. Integration will be registered but authentication may fail.`)
    }

    logger.forBot().info('Gatewayz integration registered successfully')
  },
  unregister: async ({ logger }) => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to cleanup resources in the external service.
     */
    
    // Log the unregistration for audit purposes
    logger.forBot().info('Gatewayz integration unregistered')
    
    // No specific cleanup needed for Gatewayz as it's a stateless API
    // The API key will remain valid for other uses
  },
  actions: {},
  channels: {},
  handler: async () => {},
})
