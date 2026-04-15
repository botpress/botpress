const PRODUCT_FIELDS = `
  id
  title
  handle
  description
  productType
  vendor
  availableForSale
  onlineStoreUrl
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  variants(first: 10) {
    edges {
      node {
        id
        title
        availableForSale
        price { amount currencyCode }
      }
    }
  }
  images(first: 1) {
    edges {
      node { url altText }
    }
  }
`

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    totalAmount { amount currencyCode }
    subtotalAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            product { title }
          }
        }
      }
    }
  }
  discountCodes {
    code
    applicable
  }
`

export const STOREFRONT_SEARCH_PRODUCTS = `
  query searchProducts($query: String!, $first: Int!, $after: String) {
    search(query: $query, types: PRODUCT, first: $first, after: $after) {
      edges {
        node {
          ... on Product {
            ${PRODUCT_FIELDS}
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const STOREFRONT_GET_PRODUCT_BY_HANDLE = `
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_FIELDS}
    }
  }
`

export const STOREFRONT_GET_PRODUCT_BY_ID = `
  query getProductById($id: ID!) {
    product(id: $id) {
      ${PRODUCT_FIELDS}
    }
  }
`

export const STOREFRONT_LIST_COLLECTIONS = `
  query listCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          description
          image { url altText }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const STOREFRONT_GET_COLLECTION_BY_HANDLE = `
  query getCollectionByHandle($handle: String!, $productsFirst: Int!) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      image { url altText }
      products(first: $productsFirst) {
        edges {
          node {
            ${PRODUCT_FIELDS}
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

export const STOREFRONT_GET_COLLECTION_BY_ID = `
  query getCollectionById($id: ID!, $productsFirst: Int!) {
    collection(id: $id) {
      id
      title
      handle
      description
      image { url altText }
      products(first: $productsFirst) {
        edges {
          node {
            ${PRODUCT_FIELDS}
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

export const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const CART_QUERY = `
  query getCart($id: ID!) {
    cart(id: $id) {
      ${CART_FIELDS}
    }
  }
`

export const CART_LINES_ADD = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const CART_DISCOUNT_CODES_UPDATE = `
  mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`
