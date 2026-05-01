import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { exchangeCodeForAccessToken, ShopifyAdminClient } from '../client'
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
    .addStep({ id: 'get-shop', handler: _getShopHandler })
    .addStep({ id: 'validate-shop', handler: _validateShopHandler })
    .addStep({ id: 'authorize', handler: _authorizeHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) =>
  responses.displayButtons({
    pageTitle: 'Connect Shopify Storefront',
    htmlOrMarkdownPageContents:
      'This wizard will connect your Shopify storefront to Botpress. If the integration was previously connected, the existing connection will be reset.\n\nDo you want to continue?',
    buttons: [
      { action: 'navigate', label: 'Yes, continue', navigateToStep: 'get-shop', buttonType: 'primary' },
      { action: 'close', label: 'No, cancel', buttonType: 'secondary' },
    ],
  })

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
    accessToken: undefined,
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

const _oauthCallbackHandler: WizardHandler = async ({ query, client, ctx, responses }) => {
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
    accessToken,
    storefrontAccessToken,
  })

  await client.configureIntegration({ identifier: shopDomainFromCallback })

  return responses.redirectToStep('end')
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
export const provisionStorefrontAccessToken = async (admin: ShopifyAdminClient): Promise<string | undefined> =>
  _provisionStorefrontToken(admin)

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
  accessToken?: string
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
