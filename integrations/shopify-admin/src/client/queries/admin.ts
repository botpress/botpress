export const PRODUCTS_QUERY = `
  query listProducts($first: Int!, $query: String, $after: String) {
    products(first: $first, query: $query, after: $after) {
      edges {
        node {
          id
          title
          handle
          status
          vendor
          productType
          descriptionHtml
          createdAt
          updatedAt
          onlineStoreUrl
          onlineStorePreviewUrl
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
              }
            }
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

export const PRODUCT_QUERY = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      vendor
      productType
      descriptionHtml
      createdAt
      updatedAt
      onlineStoreUrl
      onlineStorePreviewUrl
      variants(first: 100) {
        edges {
          node {
            id
            title
            price
            sku
            inventoryQuantity
          }
        }
      }
    }
  }
`

export const CUSTOMERS_QUERY = `
  query searchCustomers($query: String!) {
    customers(first: 50, query: $query) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
          numberOfOrders
          amountSpent {
            amount
            currencyCode
          }
          createdAt
          updatedAt
        }
      }
    }
  }
`

export const ORDER_QUERY = `
  query getOrder($id: ID!) {
    order(id: $id) {
      id
      name
      email
      phone
      createdAt
      updatedAt
      cancelledAt
      closedAt
      displayFinancialStatus
      displayFulfillmentStatus
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 100) {
        edges {
          node {
            title
            quantity
            variant {
              id
              title
              price
              sku
              inventoryQuantity
            }
          }
        }
      }
      customer {
        id
        firstName
        lastName
        email
        phone
        createdAt
        updatedAt
      }
    }
  }
`

export const CUSTOMER_ORDERS_QUERY = `
  query listCustomerOrders($customerId: ID!, $first: Int!, $query: String) {
    customer(id: $customerId) {
      orders(first: $first, query: $query) {
        edges {
          node {
            id
            name
            email
            phone
            createdAt
            updatedAt
            cancelledAt
            closedAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 50) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
          }
        }
      }
    }
  }
`

export const WEBHOOK_SUBSCRIPTION_CREATE = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const WEBHOOK_SUBSCRIPTION_DELETE = `
  mutation webhookSubscriptionDelete($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`

export const WEBHOOK_SUBSCRIPTIONS_QUERY = `
  query webhookSubscriptions($first: Int!) {
    webhookSubscriptions(first: $first) {
      edges {
        node {
          id
          topic
          uri
        }
      }
    }
  }
`
