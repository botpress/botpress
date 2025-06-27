import { Client } from '@botpress/client'
import actions from './actions'
import { getBigCommerceClient, BigCommerceClient } from './client'
import { PRODUCT_TABLE_SCHEMA, PRODUCTS_TABLE_NAME as PRODUCT_TABLE } from './schemas/products'
import * as bp from '.botpress'

// this client is necessary for table operations
const getVanillaClient = (client: bp.Client): Client => client._inner
export type BigCommerceProductImage = {
  is_thumbnail: boolean
  url_standard: string
}
type WebhookType = 'created' | 'updated' | 'deleted'
const determineWebhookTypeFromScope = (scope: string): WebhookType | undefined => {
  if (scope.includes('created')) {
    return 'created'
  } else if (scope.includes('updated')) {
    return 'updated'
  } else if (scope.includes('deleted')) {
    return 'deleted'
  }
  return undefined
}

const determineWebhookTypeFromProducer = (webhookData: WebhookDataWithProducer): WebhookType | undefined => {
  if (webhookData.data && webhookData.data.type) {
    return webhookData.data.type.toLowerCase() as WebhookType
  }
  return undefined
}

const isBigCommerceWebhook = (headers: Record<string, string | string[] | undefined>): boolean => {
  return !!(
    (headers['webhook-id'] && headers['webhook-signature'] && headers['webhook-timestamp']) ||
    Object.keys(headers).some(
      (key) => key.toLowerCase().includes('bigcommerce') || key.toLowerCase().includes('bc-webhook')
    )
  )
}

type WebhookData = {
  data?: {
    id?: string | number
    entity_id?: string | number
  }
  id?: string | number
}

type WebhookDataWithProducer = WebhookData & {
  producer?: string
  data?: {
    id?: string | number
    entity_id?: string | number
    type?: string
  }
}

const extractProductId = (webhookData: WebhookData): string | undefined => {
  if (webhookData?.data?.id) return String(webhookData.data.id)
  if (webhookData?.data?.entity_id) return String(webhookData.data.entity_id)
  if (webhookData?.id) return String(webhookData.id)
  return undefined
}

export const stripHtmlTags = (html: string | undefined): string => {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const getProductImageUrl = (images: BigCommerceProductImage[]): string => {
  if (!images || images.length === 0) return ''

  const thumbnailImage = images.find((img) => img.is_thumbnail)
  return thumbnailImage ? thumbnailImage.url_standard : images[0]?.url_standard || ''
}

const handleProductCreateOrUpdate = async (
  productId: string,
  bigCommerceClient: BigCommerceClient,
  botpressVanillaClient: Client,
  tableName: string,
  isCreated: boolean,
  logger: bp.Logger
) => {
  logger.forBot().info(`Fetching product details for ID: ${productId}`)

  const productResponse = await bigCommerceClient.getProduct(productId.toString())
  const product = productResponse.data

  if (!product) return null
  const categoriesResponse = await bigCommerceClient.getCategories()
  const categoryById: Record<number, string> = {}

  if (categoriesResponse && categoriesResponse.data) {
    for (const category of categoriesResponse.data) {
      categoryById[category.id] = category.name
    }
  }
  const brandsResponse = await bigCommerceClient.getBrands()
  const brandById: Record<number, string> = {}

  if (brandsResponse && brandsResponse.data) {
    for (const brand of brandsResponse.data) {
      brandById[brand.id] = brand.name
    }
  }

  const categoryNames =
    product.categories?.map((categoryId: number) => categoryById[categoryId] || categoryId.toString()) || []

  const categories = categoryNames.join(',')

  const brandName = product.brand_id ? brandById[product.brand_id] || product.brand_id.toString() : ''

  let imageUrl = ''
  if (product.images && product.images.length > 0) {
    imageUrl = getProductImageUrl(product.images)
  }

  const productRow = {
    product_id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    sale_price: product.sale_price,
    retail_price: product.retail_price,
    total_sold: product.total_sold || 0,
    weight: product.weight,
    type: product.type,
    inventory_level: product.inventory_level,
    inventory_tracking: product.inventory_tracking,
    brand_name: brandName,
    categories,
    availability: product.availability,
    condition: product.condition,
    is_visible: product.is_visible,
    sort_order: product.sort_order,
    description: stripHtmlTags(product.description)?.substring(0, 1000) || '',
    image_url: imageUrl,
    url: product.custom_url?.url || '',
  }

  const { rows } = await botpressVanillaClient.findTableRows({
    table: tableName,
    filter: { product_id: product.id },
  })

  if (rows.length > 0 && rows[0]?.id) {
    logger.forBot().info(`Updating existing product ID: ${productId}`)
    await botpressVanillaClient.updateTableRows({
      table: tableName,
      rows: [{ id: rows[0].id, ...productRow }],
    })
  } else {
    logger.forBot().info(`Creating new product ID: ${productId}`)
    await botpressVanillaClient.createTableRows({
      table: tableName,
      rows: [productRow],
    })
  }

  return {
    success: true,
    message: `Product ${productId} ${isCreated ? 'created' : 'updated'} successfully`,
  }
}

const handleProductDelete = async (
  productId: string,
  botpressVanillaClient: Client,
  tableName: string,
  logger: bp.Logger
) => {
  logger.forBot().info(`Deleting product ID: ${productId}`)

  const productIdNumber = Number(productId)

  const { rows } = await botpressVanillaClient.findTableRows({
    table: tableName,
    filter: { product_id: productIdNumber },
  })

  if (rows.length > 0 && rows[0]?.id) {
    await botpressVanillaClient.deleteTableRows({
      table: tableName,
      ids: [rows[0].id],
    })

    return {
      success: true,
      message: `Product ${productId} deleted successfully`,
    }
  } else {
    logger.forBot().warn(`Product ID ${productId} not found for deletion`)
    return {
      success: true,
      message: `Product ${productId} not found for deletion`,
    }
  }
}

type BigCommerceConfig = {
  storeHash: string
  accessToken: string
  clientId?: string
  apiVersion?: string
}

const setupBigCommerceWebhooks = async (configuration: BigCommerceConfig, logger: bp.Logger, webhookId: string) => {
  const webhookUrl = `https://webhook.botpress.cloud/${webhookId}`
  logger.forBot().info('Setting up BigCommerce webhooks...')

  try {
    const bigCommerceClient = getBigCommerceClient(configuration)
    const webhookResults = await bigCommerceClient.createProductWebhooks(webhookUrl)
    logger.forBot().info('Webhooks created successfully!', webhookResults)
    return { success: true }
  } catch (webhookError) {
    logger.forBot().error('Error creating webhooks:', webhookError)
    return { success: false, error: webhookError }
  }
}

const syncBigCommerceProducts = async (ctx: bp.Context, client: bp.Client, logger: bp.Logger) => {
  logger.forBot().info('Syncing BigCommerce products...')

  try {
    const syncResult = await actions.syncProducts({
      ctx,
      client,
      logger,
      input: {},
      type: 'syncProducts',
      metadata: { setCost: (_cost: number) => {} },
    })

    logger.forBot().info('Product sync completed!')
    return { success: true, result: syncResult }
  } catch (syncError) {
    logger.forBot().error('Error syncing products during initialization', syncError)
    return { success: false, error: syncError }
  }
}

const processWebhookEvent = async (
  webhookType: WebhookType,
  productId: string,
  bigCommerceClient: BigCommerceClient,
  botpressVanillaClient: Client,
  tableName: string,
  logger: bp.Logger,
  ctx: bp.Context,
  client: bp.Client
) => {
  if (webhookType === 'created' || webhookType === 'updated') {
    return await handleProductCreateOrUpdate(
      productId.toString(),
      bigCommerceClient,
      botpressVanillaClient,
      tableName,
      webhookType === 'created',
      logger
    )
  }

  if (webhookType === 'deleted') {
    return await handleProductDelete(productId.toString(), botpressVanillaClient, tableName, logger)
  }

  logger.forBot().warn(`Unrecognized event type: ${webhookType}, falling back to full sync`)

  const result = await actions.syncProducts({
    ctx,
    client,
    logger,
    input: {},
    type: 'syncProducts',
    metadata: { setCost: (_cost: number) => {} },
  })

  if (result) {
    result.message = 'Full sync performed (unrecognized event type)'
  }

  return result
}
const processWebhookByType = async (
  webhookType: WebhookType,
  productId: string,
  bigCommerceClient: BigCommerceClient,
  botpressVanillaClient: Client,
  tableName: string,
  logger: bp.Logger,
  ctx: bp.Context,
  client: bp.Client
) => {
  try {
    return await processWebhookEvent(
      webhookType,
      productId,
      bigCommerceClient,
      botpressVanillaClient,
      tableName,
      logger,
      ctx,
      client
    )
  } catch (error) {
    logger.forBot().error(`Error processing ${webhookType} for product ${productId}:`, error)
    throw error
  }
}

export default new bp.Integration({
  register: async ({ client, ctx, logger }) => {
    try {
      logger.forBot().info('Registering BigCommerce integration')
      const botpressVanillaClient = getVanillaClient(client)

      await botpressVanillaClient.getOrCreateTable({
        table: PRODUCT_TABLE,
        schema: PRODUCT_TABLE_SCHEMA,
      })

      const syncResult = await syncBigCommerceProducts(ctx, client, logger)

      if (syncResult.success && ctx.webhookId) {
        await setupBigCommerceWebhooks(ctx.configuration, logger, ctx.webhookId)
      }

      logger.forBot().info('BigCommerce integration registered successfully')
    } catch (error) {
      logger.forBot().error('Error registering BigCommerce integration', error)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async ({ req, client, ctx, logger }) => {
    if (req.method !== 'POST') {
      return {
        status: 405,
        body: JSON.stringify({
          success: false,
          message: 'Method not allowed',
        }),
      }
    }

    try {
      const isBCWebhook = isBigCommerceWebhook(req.headers)
      if (!isBCWebhook) {
        logger.forBot().warn('Rejecting request - not a BigCommerce webhook')
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            message: 'Unauthorized: Request does not appear to be from BigCommerce',
          }),
        }
      }

      const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      const botpressVanillaClient = getVanillaClient(client)
      const tableName = PRODUCT_TABLE
      const bigCommerceClient = getBigCommerceClient(ctx.configuration)

      if (!webhookData) {
        logger.forBot().warn('No webhook data found, unable to process')
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            message: 'No webhook data found',
          }),
        }
      }

      const productId = extractProductId(webhookData)
      let webhookType: WebhookType | undefined

      if (webhookData.scope && typeof webhookData.scope === 'string' && webhookData.scope.includes('product')) {
        webhookType = determineWebhookTypeFromScope(webhookData.scope)
      } else if (webhookData.producer && webhookData.producer === 'product') {
        webhookType = determineWebhookTypeFromProducer(webhookData)
      }

      if (!webhookType || !productId) {
        logger.forBot().warn('Could not extract product ID or event type from webhook, falling back to full sync')

        logger.forBot().info('Webhook info:', {
          hasProductId: !!productId,
          hasScope: !!webhookType,
        })
        const result = await actions.syncProducts({
          ctx,
          client,
          logger,
          input: {},
          type: 'syncProducts',
          metadata: { setCost: (_cost: number) => {} },
        })

        return {
          status: 200,
          body: JSON.stringify({
            success: result.success,
            message: 'Full sync performed (fallback)',
            syncResult: result,
          }),
        }
      }

      logger.forBot().info(`Processing event: ${webhookType} for product ID: ${productId}`)

      const result = await processWebhookByType(
        webhookType,
        productId.toString(),
        bigCommerceClient,
        botpressVanillaClient,
        tableName,
        logger,
        ctx,
        client
      )

      return {
        status: 200,
        body: JSON.stringify(result),
      }
    } catch (error) {
      logger.forBot().error('Error handling webhook:', error)
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: `Error handling webhook: ${error instanceof Error ? error.message : String(error)}`,
        }),
      }
    }
  },
})
