// Admin GraphQL mutations used solely to provision a Storefront API access token after OAuth.
// The Storefront integration does not otherwise touch the Admin API at runtime.

export const STOREFRONT_ACCESS_TOKENS_QUERY = `
  query storefrontAccessTokens {
    shop {
      storefrontAccessTokens(first: 10) {
        edges {
          node {
            id
            title
            accessToken
          }
        }
      }
    }
  }
`

export const STOREFRONT_ACCESS_TOKEN_CREATE = `
  mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        id
        title
        accessToken
      }
      userErrors {
        field
        message
      }
    }
  }
`
