import { z } from '@botpress/sdk'

// Message schema for chat completions
export const messageSchema = z.object({
  role: z.string().describe('The role of the message sender (user, assistant, system)'),
  content: z.string().describe('The message content')
})

// Chat completions input schema
export const chatCompletionsInputSchema = z.object({
  model: z.string().describe('The AI model to use for completion'),
  messages: z.array(messageSchema).describe('Array of messages for the conversation'),
  max_tokens: z.number().optional().describe('Maximum number of tokens to generate'),
  temperature: z.number().optional().describe('Controls randomness (0-2)'),
  top_p: z.number().optional().describe('Nucleus sampling parameter (0-1)'),
  frequency_penalty: z.number().optional().describe('Frequency penalty (-2 to 2)'),
  presence_penalty: z.number().optional().describe('Presence penalty (-2 to 2)')
})

// Chat completions output schema
export const chatCompletionsOutputSchema = z.object({
  response: z.any().describe('The chat completion response from the AI model'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})

// Get models output schema
export const getModelsOutputSchema = z.object({
  models: z.array(z.any()).describe('List of available AI models'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})

// Get providers output schema
export const getProvidersOutputSchema = z.object({
  providers: z.array(z.any()).describe('List of model providers with statistics'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})

// User balance output schema
export const getUserBalanceOutputSchema = z.object({
  balance: z.number().optional().describe('User credit balance'),
  credits: z.number().optional().describe('User available credits'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})

// User profile output schema
export const getUserProfileOutputSchema = z.object({
  user_id: z.number().describe('User ID'),
  username: z.string().nullable().describe('Username'),
  email: z.string().nullable().describe('User email'),
  api_key: z.string().describe('User API key'),
  credits: z.number().describe('Available credits'),
  auth_method: z.string().nullable().describe('Authentication method'),
  subscription_status: z.string().nullable().describe('Subscription status'),
  trial_expires_at: z.string().nullable().describe('Trial expiration date'),
  is_active: z.boolean().nullable().describe('Whether account is active'),
  registration_date: z.string().nullable().describe('Registration date'),
  created_at: z.string().nullable().describe('Account creation timestamp'),
  updated_at: z.string().nullable().describe('Last update timestamp'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})

// Update profile input schema
export const updateUserProfileInputSchema = z.object({
  name: z.string().optional().describe('User name'),
  email: z.string().optional().describe('User email'),
  preferences: z.record(z.any()).optional().describe('User preferences object'),
  settings: z.record(z.any()).optional().describe('User settings object')
})

// Create API key input schema
export const createApiKeyInputSchema = z.object({
  key_name: z.string().describe('Name for the new API key'),
  environment_tag: z.string().optional().default('live').describe('Environment tag (default: live)'),
  scope_permissions: z.record(z.array(z.string())).optional().describe('Scope permissions object'),
  expiration_days: z.number().optional().describe('Number of days until key expires'),
  max_requests: z.number().optional().describe('Maximum number of requests for this key'),
  ip_allowlist: z.array(z.string()).optional().describe('List of allowed IP addresses'),
  domain_referrers: z.array(z.string()).optional().describe('List of allowed domain referrers')
})

// API key management output schema
export const apiKeyOutputSchema = z.object({
  success: z.boolean().describe('Whether the request was successful'),
  data: z.any().optional().describe('API key data'),
  error: z.string().optional().describe('Error message if the request failed')
})

// User registration input schema
export const userRegistrationInputSchema = z.object({
  username: z.string().describe('Username for the new account'),
  email: z.string().email().describe('Email address for the new account'),
  auth_method: z.enum(['email', 'wallet', 'google']).optional().default('email').describe('Authentication method'),
  initial_credits: z.number().optional().default(1000).describe('Initial credits to assign'),
  environment_tag: z.string().optional().default('live').describe('Environment tag'),
  key_name: z.string().optional().default('Primary Key').describe('Name for the initial API key')
})

// User registration output schema
export const userRegistrationOutputSchema = z.object({
  user_id: z.number().describe('Created user ID'),
  username: z.string().describe('Username'),
  email: z.string().describe('User email'),
  api_key: z.string().describe('Generated API key'),
  credits: z.number().describe('Initial credits'),
  environment_tag: z.string().describe('Environment tag'),
  scope_permissions: z.record(z.array(z.string())).describe('API key permissions'),
  auth_method: z.string().describe('Authentication method used'),
  subscription_status: z.string().describe('Subscription status'),
  message: z.string().describe('Registration success message'),
  timestamp: z.string().describe('Registration timestamp'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})

// Health check output schema
export const healthCheckOutputSchema = z.object({
  status: z.string().describe('Health status'),
  success: z.boolean().describe('Whether the health check passed'),
  error: z.string().optional().describe('Error message if the health check failed')
})

// API key usage output schema
export const apiKeyUsageOutputSchema = z.object({
  usage: z.any().describe('API key usage statistics'),
  success: z.boolean().describe('Whether the request was successful'),
  error: z.string().optional().describe('Error message if the request failed')
})
