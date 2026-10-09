import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { exchangeCodeForAccessToken, fetchClientCredentialsToken, ShopifyAdminClient } from '../client'
import { STOREFRONT_ACCESS_TOKEN_CREATE, STOREFRONT_ACCESS_TOKENS_QUERY } from '../client/queries/admin'
import { verifyOAuthCallbackHmac } from './hmac'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const SHOPIFY_OAUTH_SCOPES = [
  'unauthenticated_read_product_listings',
  'unauthenticated_write_checkouts',
  'unauthenticated_read_checkouts',
].join(',')

const SHOP_NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i
const STOREFRONT_TOKEN_TITLE = 'Botpress Storefront Access'

export const oauthWizardHandler = async (props: bp.HandlerProps): Promise<sdk.Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'route-choice', handler: _routeChoiceHandler })
    .addStep({ id: 'manual-instructions', handler: _manualInstructionsHandler })
    .addStep({ id: 'get-manual-credentials', handler: _getManualCredentialsHandler })
    .addStep({ id: 'save-manual-credentials', handler: _saveManualCredentialsHandler })
    .addStep({ id: 'get-shop', handler: _getShopHandler })
    .addStep({ id: 'validate-shop', handler: _validateShopHandler })
    .addStep({ id: 'authorize', handler: _authorizeHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) =>
  responses.displayChoices({
    pageTitle: 'Connect Shopify Storefront',
    htmlOrMarkdownPageContents:
      'This wizard will connect your Shopify storefront to Botpress. If the integration was previously connected, the existing connection will be reset.\n\nChoose how you would like to connect:',
    choices: [
      { label: 'Connect with OAuth', value: 'oauth' },
      { label: 'Use my own Shopify app', value: 'manual' },
    ],
    nextStepId: 'route-choice',
  })

const _routeChoiceHandler: WizardHandler = ({ selectedChoice, responses }) => {
  switch (selectedChoice) {
    case 'manual':
      return responses.redirectToStep('manual-instructions')
    case 'oauth':
    default:
      return responses.redirectToStep('get-shop')
  }
}

const _manualInstructionsHandler: WizardHandler = ({ responses }) =>
  responses.displayButtons({
    pageTitle: 'Create a Shopify App',
    htmlOrMarkdownPageContents:
      '1. Open the <a href="https://dev.shopify.com/dashboard" target="_blank">Shopify Dev Dashboard</a>, go to **Apps**, click **Create app**, then select **Create app manually**.' +
      '\n2. Enter a name for the app. Leave the URLs empty.' +
      '\n3. In the **API Access** section, add the Storefront API scopes `unauthenticated_read_product_listings`, `unauthenticated_read_checkouts`, and `unauthenticated_write_checkouts`.' +
      '\n4. Click **Create app**, then click **Release**.' +
      '\n5. Go back to the **App overview** and click **Install app** in the top right corner.',
    buttons: [
      { action: 'navigate', label: 'Next step', navigateToStep: 'get-manual-credentials', buttonType: 'primary' },
    ],
  })

const _manualCredentialsSchema = sdk.z.object({
  shopDomain: sdk.z
    .string()
    .min(1)
    .title('Shop Domain')
    .describe('The myshopify.com domain of your store, e.g. your-store.myshopify.com. Find it in Settings → Domains.'),
  clientId: sdk.z.string().min(1).title('Client ID').describe('The Client ID of your Shopify app'),
  clientSecret: sdk.z.string().secret().min(1).title('Client Secret').describe('The Client Secret of your Shopify app'),
})

const _manualCredentialsForm = {
  pageTitle: 'Enter Your App Credentials',
  htmlOrMarkdownPageContents:
    "Enter your store domain, then copy the app's **Client ID** and **Client Secret** from its settings in the Dev Dashboard.",
  schema: _manualCredentialsSchema,
  nextStepId: 'save-manual-credentials',
}

const _getManualCredentialsHandler: WizardHandler = ({ responses }) => responses.displayForm(_manualCredentialsForm)

const _saveManualCredentialsHandler: WizardHandler = async ({ client, ctx, logger, formValues, responses }) => {
  if (!formValues) {
    return responses.redirectToStep('get-manual-credentials')
  }

  const parsed = _manualCredentialsSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._manualCredentialsForm,
      errors: parsed.error,
      previousValues: formValues as sdk.z.input<typeof _manualCredentialsSchema>,
    })
  }

  const { clientId, clientSecret } = parsed.data
  const shopDomain = normalizeShopDomain(parsed.data.shopDomain)
  if (!SHOP_NAME_REGEX.test(shopDomain)) {
    return responses.displayButtons({
      pageTitle: 'Invalid Shop Domain',
      htmlOrMarkdownPageContents: `"${parsed.data.shopDomain}" doesn't look like a valid Shopify store domain. Please enter a domain like \`your-store.myshopify.com\`.`,
      buttons: [
        { action: 'navigate', label: 'Try again', navigateToStep: 'get-manual-credentials', buttonType: 'primary' },
        { action: 'close', label: 'Cancel', buttonType: 'secondary' },
      ],
    })
  }

  try {
    // Same as the OAuth callback: the Admin token is only used to provision a Storefront token,
    // so the app credentials are not persisted.
    const accessToken = await fetchClientCredentialsToken({ shop: shopDomain, clientId, clientSecret })
    const admin = new ShopifyAdminClient({ shopDomain, accessToken })
    const storefrontAccessToken = await _provisionStorefrontToken(admin)
    if (!storefrontAccessToken) {
      return responses.endWizard({
        success: false,
        errorMessage:
          'Failed to provision a Storefront API access token. Ensure your Shopify app has the `unauthenticated_*` Storefront API scopes.',
      })
    }

    await _patchCredentialsState(client, ctx, { shopDomain, storefrontAccessToken })
    await client.configureIntegration({ identifier: shopDomain })
  } catch (e) {
    logger.forBot().error({ err: e }, 'Shopify manual setup failed')
    return responses.endWizard({
      success: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    })
  }

  return responses.redirectToStep('end')
}

const _getShopHandler: WizardHandler = ({ responses }) =>
  responses.displayInput({
    pageTitle: 'Enter Shopify Store',
    htmlOrMarkdownPageContents:
      'Enter the domain of your Shopify store. It looks like `your-store.myshopify.com` — you can find it in the Shopify admin URL.',
    input: { label: 'e.g. your-store.myshopify.com', type: 'text' },
    nextStepId: 'validate-shop',
  })

const _validateShopHandler: WizardHandler = async ({ client, ctx, inputValue, responses }) => {
  if (!inputValue) {
    throw new sdk.RuntimeError('Shop domain cannot be empty')
  }

  const shopDomain = normalizeShopDomain(inputValue)
  if (!SHOP_NAME_REGEX.test(shopDomain)) {
    return responses.displayButtons({
      pageTitle: 'Invalid Shop Domain',
      htmlOrMarkdownPageContents: `"${inputValue}" doesn't look like a valid Shopify store domain. Please enter a domain like \`your-store.myshopify.com\`.`,
      buttons: [
        { action: 'navigate', label: 'Try again', navigateToStep: 'get-shop', buttonType: 'primary' },
        { action: 'close', label: 'Cancel', buttonType: 'secondary' },
      ],
    })
  }

  await _patchCredentialsState(client, ctx, {
    shopDomain,
    storefrontAccessToken: undefined,
  })

  return responses.displayButtons({
    pageTitle: 'Confirm Shopify Store',
    htmlOrMarkdownPageContents: `Is <strong>${shopDomain}.myshopify.com</strong> your Shopify store?`,
    buttons: [
      { action: 'navigate', label: 'Yes, connect', navigateToStep: 'authorize', buttonType: 'primary' },
      { action: 'navigate', label: 'No, go back', navigateToStep: 'get-shop', buttonType: 'secondary' },
    ],
  })
}

const _authorizeHandler: WizardHandler = async ({ client, ctx, responses }) => {
  const { shopDomain } = await _getCredentialsState(client, ctx)
  if (!shopDomain) {
    throw new sdk.RuntimeError('Shop domain missing from state; please restart the wizard')
  }

  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback').toString()
  const authorizeUrl =
    `https://${shopDomain}.myshopify.com/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(bp.secrets.SHOPIFY_CLIENT_ID)}` +
    `&scope=${encodeURIComponent(SHOPIFY_OAUTH_SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(ctx.webhookId)}`

  return responses.redirectToExternalUrl(authorizeUrl)
}

const _oauthCallbackHandler: WizardHandler = async ({ query, client, ctx, logger, responses }) => {
  try {
    const state = query.get('state')
    if (state !== ctx.webhookId) {
      return responses.endWizard({
        success: false,
        errorMessage: 'OAuth state mismatch — possible CSRF attempt. Please retry the connection.',
      })
    }

    if (!verifyOAuthCallbackHmac(query, bp.secrets.SHOPIFY_CLIENT_SECRET)) {
      return responses.endWizard({
        success: false,
        errorMessage: 'Shopify OAuth callback HMAC verification failed. Please retry the connection.',
      })
    }

    const code = query.get('code')
    const shopParam = query.get('shop')
    if (!code || !shopParam) {
      return responses.endWizard({
        success: false,
        errorMessage: 'Missing `code` or `shop` parameter on Shopify OAuth callback.',
      })
    }

    const shopDomainFromCallback = shopParam.replace(/\.myshopify\.com$/i, '').toLowerCase()
    const stored = await _getCredentialsState(client, ctx)
    if (stored.shopDomain && stored.shopDomain.toLowerCase() !== shopDomainFromCallback) {
      return responses.endWizard({
        success: false,
        errorMessage: `Shop mismatch: expected ${stored.shopDomain} but Shopify returned ${shopDomainFromCallback}.`,
      })
    }

    const accessToken = await exchangeCodeForAccessToken({ shop: shopDomainFromCallback, code })

    const admin = new ShopifyAdminClient({ shopDomain: shopDomainFromCallback, accessToken })
    const storefrontAccessToken = await _provisionStorefrontToken(admin)
    if (!storefrontAccessToken) {
      return responses.endWizard({
        success: false,
        errorMessage:
          'Failed to provision a Storefront API access token. Ensure the Shopify app has `unauthenticated_*` scopes enabled.',
      })
    }

    await _patchCredentialsState(client, ctx, {
      shopDomain: shopDomainFromCallback,
      storefrontAccessToken,
    })

    await client.configureIntegration({ identifier: shopDomainFromCallback })

    return responses.redirectToStep('end')
  } catch (e) {
    logger.forBot().error({ err: e }, 'Shopify OAuth callback failed')
    return responses.endWizard({
      success: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    })
  }
}

const _endHandler: WizardHandler = ({ responses }) => responses.endWizard({ success: true })

export const normalizeShopDomain = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.myshopify\.com$/, '')

type StorefrontAccessTokenNode = { id: string; title: string; accessToken: string }

type StorefrontAccessTokensResponse = {
  shop: {
    storefrontAccessTokens: {
      edges: Array<{ node: StorefrontAccessTokenNode }>
    }
  }
}

type StorefrontAccessTokenCreateResponse = {
  storefrontAccessTokenCreate: {
    storefrontAccessToken: StorefrontAccessTokenNode | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

// Idempotently ensure a Storefront Access Token exists for this shop. Reuses an existing
// Botpress-labeled token if present, otherwise creates a new one via the Admin API.
const _provisionStorefrontToken = async (admin: ShopifyAdminClient): Promise<string | undefined> => {
  const existing = await admin.query<StorefrontAccessTokensResponse>(STOREFRONT_ACCESS_TOKENS_QUERY)
  const found = existing.shop.storefrontAccessTokens.edges.find((e) => e.node.title === STOREFRONT_TOKEN_TITLE)
  if (found) {
    return found.node.accessToken
  }

  const result = await admin.query<StorefrontAccessTokenCreateResponse>(STOREFRONT_ACCESS_TOKEN_CREATE, {
    input: { title: STOREFRONT_TOKEN_TITLE },
  })

  if (result.storefrontAccessTokenCreate.userErrors.length) {
    return undefined
  }

  return result.storefrontAccessTokenCreate.storefrontAccessToken?.accessToken
}

type CredentialsPatch = {
  shopDomain?: string
  storefrontAccessToken?: string
}

// `client.patchState` has known issues — merge manually via getState/setState
const _patchCredentialsState = async (client: bp.Client, ctx: bp.Context, patch: CredentialsPatch) => {
  const current = await _getCredentialsState(client, ctx)
  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: { ...current, ...patch },
  })
}

const _getCredentialsState = async (client: bp.Client, ctx: bp.Context): Promise<CredentialsPatch> => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    return (state?.payload as CredentialsPatch | undefined) ?? {}
  } catch {
    return {}
  }
}
