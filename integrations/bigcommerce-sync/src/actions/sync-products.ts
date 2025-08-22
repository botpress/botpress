import { Client } from '@botpress/client'
import { getBigCommerceClient, BigCommerceClient } from '../client'
import { getProductImageUrl, BigCommerceProductImage, stripHtmlTags } from '../index'
import { PRODUCT_TABLE_SCHEMA, PRODUCTS_TABLE_NAME as PRODUCT_TABLE } from '../schemas/products'
import * as bp from '.botpress'

type BigCommerceProduct = {
  id: number
  name: string
  sku?: string
  price?: number
  sale_price?: number
  retail_price?: number
  weight?: number
  type?: string
  inventory_level?: number
  inventory_tracking?: string
  brand_id?: number
  categories?: number[]
  availability?: string
  condition?: string
  is_visible?: boolean
  sort_order?: number
  description?: string
  images?: Array<BigCommerceProductImage>
  custom_url?: { url: string }
  total_sold?: number
}

// Configuration for sync
type SyncConfig = {
  storeHash: string
  accessToken: string
  tableName: string
  batchSize?: number
  productsPerPage?: number
}

// Constants
const DEFAULT_BATCH_SIZE = 50
const DEFAULT_PRODUCTS_PER_PAGE = 250

// Transform BigCommerce product to table row
function transformProductToTableRow(
  product: BigCommerceProduct,
  categoryById: Record<number, string>,
  brandById: Record<number, string>
) {
  const categoryNames =
    product.categories?.map((categoryId: number) => categoryById[categoryId] || categoryId.toString()) || []

  const categories = categoryNames.join(',')
  const brandName = product.brand_id ? brandById[product.brand_id] || product.brand_id.toString() : ''
  const imageUrl = product.images && product.images.length > 0 ? getProductImageUrl(product.images) : ''

  return {
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
}

// Save products to table
async function saveProductsToTable(
  client: Client,
  tableName: string,
  products: BigCommerceProduct[],
  categoryById: Record<number, string>,
  brandById: Record<number, string>,
  batchSize: number = DEFAULT_BATCH_SIZE
) {
  try {
    const tableRows = products.map((product) => transformProductToTableRow(product, categoryById, brandById))

    const totalRows = tableRows.length
    let processedRows = 0

    while (processedRows < totalRows) {
      const batch = tableRows.slice(processedRows, processedRows + batchSize)

      await client.createTableRows({
        table: tableName,
        rows: batch,
      })

      processedRows += batch.length
    }

    return totalRows
  } catch (error) {
    console.error('Failed to save products to table:', error)
    throw error
  }
}

// Load categories and brands
async function loadCategoriesAndBrands(bigCommerceClient: BigCommerceClient) {
  const categoryById: Record<number, string> = {}
  const brandById: Record<number, string> = {}

  try {
    const categoriesResponse = await bigCommerceClient.getCategories()
    if (categoriesResponse && categoriesResponse.data) {
      categoriesResponse.data.forEach((category: { id: number; name: string }) => {
        categoryById[category.id] = category.name
      })
    }

    const brandsResponse = await bigCommerceClient.getBrands()
    if (brandsResponse && brandsResponse.data) {
      brandsResponse.data.forEach((brand: { id: number; name: string }) => {
        brandById[brand.id] = brand.name
      })
    }
  } catch (error) {
    console.error('Error loading categories/brands:', error)
    // Continue without categories/brands if they fail to load
  }

  return { categoryById, brandById }
}

// Unified function to process pages (used by both main sync and background processing)
async function processPages({
  bigCommerceClient,
  botpressClient,
  tableName,
  categoryById,
  brandById,
  startPage,
  totalPages,
  batchSize,
  productsPerPage,
  logger,
}: {
  bigCommerceClient: BigCommerceClient
  botpressClient: Client
  tableName: string
  categoryById: Record<number, string>
  brandById: Record<number, string>
  startPage: number
  totalPages: number
  batchSize: number
  productsPerPage: number
  logger: bp.Logger
}): Promise<{ processedItems: number; lastProcessedPage: number; errors: string[] }> {
  const startTime = Date.now()
  let processedItems = 0
  let lastProcessedPage = startPage - 1
  const errors: string[] = []
  const totalPagesToProcess = totalPages - startPage + 1

  logger.forBot().info(`Processing pages from ${startPage} to ${totalPages} (${totalPagesToProcess} pages total)`)

  for (let page = startPage; page <= totalPages; page++) {
    const pagesProcessed = page - startPage
    const progress = Math.round((pagesProcessed / totalPagesToProcess) * 100)

    try {
      logger.forBot().info(`Processing page ${page}/${totalPages} (${progress}% complete)...`)

      // Fetch products for this page
      const pageResult = await bigCommerceClient.getProducts({ page, limit: productsPerPage })

      if (!pageResult.data || pageResult.data.length === 0) {
        logger.forBot().warn(`No products found on page ${page}`)
        continue
      }

      // Save products to table
      await saveProductsToTable(botpressClient, tableName, pageResult.data, categoryById, brandById, batchSize)

      processedItems += pageResult.data.length
      lastProcessedPage = page

      logger.forBot().info(`Completed page ${page}: ${pageResult.data.length} products`)

      // Small delay to be respectful to the API
      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch (error) {
      const errorMessage = `Error processing page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.forBot().error(errorMessage)
      errors.push(errorMessage)
      continue
    }
  }

  const totalElapsed = Date.now() - startTime
  const pagesCompleted = lastProcessedPage - startPage + 1
  const finalProgress = Math.round((pagesCompleted / totalPagesToProcess) * 100)

  logger
    .forBot()
    .info(
      `Processing completed: ${pagesCompleted}/${totalPagesToProcess} pages (${finalProgress}%) ` +
        `in ${Math.round(totalElapsed / 1000)}s. Processed ${processedItems} products.`
    )

  return { processedItems, lastProcessedPage, errors }
}

// Helper function to initialize clients
function initializeClients(ctx: { storeHash: string; accessToken: string }, client: bp.Client) {
  const bigCommerceClient = getBigCommerceClient(ctx)
  const getVanillaClient = (client: bp.Client): Client => client._inner
  const botpressVanillaClient = getVanillaClient(client)

  return { bigCommerceClient, botpressVanillaClient }
}

// Function to handle background processing of remaining pages
export async function executeBackgroundSync({
  ctx,
  input,
  logger,
  client,
}: {
  ctx: { configuration: { storeHash: string; accessToken: string } }
  input: {
    startPage: number
    totalPages: number
    tableName: string
    batchSize: number
    productsPerPage: number
    categoryById: Record<number, string>
    brandById: Record<number, string>
  }
  logger: bp.Logger
  client: bp.Client
}) {
  const { startPage, totalPages, tableName, batchSize, productsPerPage, categoryById, brandById } = input

  // Initialize clients using helper function
  const { bigCommerceClient, botpressVanillaClient } = initializeClients(ctx.configuration, client)

  logger.forBot().info('Starting background processing...')

  const result = await processPages({
    bigCommerceClient,
    botpressClient: botpressVanillaClient,
    tableName,
    categoryById,
    brandById,
    startPage,
    totalPages,
    batchSize,
    productsPerPage,
    logger,
  })

  return {
    success: true,
    processedItems: result.processedItems,
    lastProcessedPage: result.lastProcessedPage,
    totalPages,
    errors: result.errors,
    finalProgress: Math.round(((result.lastProcessedPage - startPage + 1) / (totalPages - startPage + 1)) * 100),
    totalElapsed: Math.round((Date.now() - Date.now()) / 1000), // This will be calculated in processPages
  }
}

// Main sync function - handles first page synchronously, then continues with background processing
const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async (props) => {
  const { client, logger } = props
  const ctx = props.ctx.configuration

  // Initialize clients using helper function
  const { bigCommerceClient, botpressVanillaClient } = initializeClients(ctx, client)

  const config: SyncConfig = {
    storeHash: ctx.storeHash,
    accessToken: ctx.accessToken,
    tableName: PRODUCT_TABLE,
    batchSize: DEFAULT_BATCH_SIZE,
    productsPerPage: DEFAULT_PRODUCTS_PER_PAGE,
  }

  try {
    logger.forBot().info('Starting BigCommerce product sync')

    // Ensure table exists
    await botpressVanillaClient.getOrCreateTable({
      table: config.tableName,
      schema: PRODUCT_TABLE_SCHEMA,
    })

    // Clear existing products table
    try {
      logger.forBot().info('Clearing existing products table...')
      await botpressVanillaClient.deleteTable({
        table: config.tableName,
      })

      await botpressVanillaClient.getOrCreateTable({
        table: config.tableName,
        schema: PRODUCT_TABLE_SCHEMA,
      })
    } catch (error) {
      logger.forBot().warn('Error clearing products table:', error)
    }

    // Step 1: Load categories and brands
    logger.forBot().info('Loading categories and brands...')
    const { categoryById, brandById } = await loadCategoriesAndBrands(bigCommerceClient)
    logger
      .forBot()
      .info(`Loaded ${Object.keys(categoryById).length} categories and ${Object.keys(brandById).length} brands`)

    // Step 2: Get first page synchronously
    logger.forBot().info('Fetching first page synchronously...')

    // Get total pages first
    const firstPageResponse = await bigCommerceClient.getProducts({ page: 1, limit: config.productsPerPage! })
    const totalPages: number = firstPageResponse.meta?.pagination?.total_pages ?? 1
    const firstPageCount = firstPageResponse.data?.length ?? 0

    if (firstPageCount === 0) {
      logger.forBot().warn('No products found in BigCommerce store')
      return {
        success: true,
        message: 'No products found in BigCommerce store',
        productsCount: 0,
        firstPageProcessed: 0,
        totalPages: 0,
        backgroundProcessing: false,
      }
    }

    // Step 3: Process first page using unified function
    logger.forBot().info(`Processing first page (${firstPageCount} products)...`)
    await processPages({
      bigCommerceClient,
      botpressClient: botpressVanillaClient,
      tableName: config.tableName,
      categoryById,
      brandById,
      startPage: 1,
      totalPages: 1, // Only process first page
      batchSize: DEFAULT_BATCH_SIZE,
      productsPerPage: DEFAULT_PRODUCTS_PER_PAGE,
      logger,
    })

    logger.forBot().info(`First page processed. Total pages: ${totalPages}, First page items: ${firstPageCount}`)

    // Step 4: If there are more pages, send webhook to trigger background processing
    if (totalPages > 1) {
      logger.forBot().info('First page processed. Sending webhook to trigger background processing...')

      // Send webhook to trigger background processing
      const webhookUrl = `https://webhook.botpress.cloud/${props.ctx.webhookId}`

      const payload = {
        event: 'background-sync-triggered',
        data: {
          startPage: 2,
          totalPages: totalPages, // Ensure it's a number
          tableName: config.tableName,
          batchSize: DEFAULT_BATCH_SIZE,
          productsPerPage: DEFAULT_PRODUCTS_PER_PAGE,
          storeHash: config.storeHash,
          accessToken: config.accessToken,
          categoryById, // Include categories data
          brandById, // Include brands data
        },
      }

      try {
        // Send webhook asynchronously (don't await to avoid blocking)
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).catch((error) => {
          logger.forBot().error('Failed to send background processing webhook:', error)
        })

        logger.forBot().info('Background processing webhook sent successfully')

        // Return immediately after sending webhook
        return {
          success: true,
          firstPageProcessed: firstPageCount,
          totalPages,
          productsCount: firstPageCount, // Only first page products for now
          backgroundProcessing: true,
          lastProcessedPage: 1,
          backgroundErrors: [],
          message: `First page processed synchronously. Background processing webhook sent for remaining ${totalPages - 1} pages.`,
        }
      } catch (error) {
        logger.forBot().error('Failed to send background processing webhook:', error)
        return {
          success: false,
          firstPageProcessed: firstPageCount,
          totalPages,
          productsCount: firstPageCount,
          backgroundProcessing: false,
          lastProcessedPage: 1,
          backgroundErrors: [
            `Failed to send background processing webhook: ${error instanceof Error ? error.message : String(error)}`,
          ],
          message: 'First page processed but failed to send background processing webhook.',
        }
      }
    } else {
      // Only one page, we're done
      return {
        success: true,
        firstPageProcessed: firstPageCount,
        totalPages: 1,
        productsCount: firstPageCount,
        backgroundProcessing: false,
        message: 'All products synced synchronously (single page).',
      }
    }
  } catch (error) {
    logger.forBot().error('Sync failed:', error)
    return {
      success: false,
      message: `Error syncing BigCommerce products: ${error instanceof Error ? error.message : String(error)}`,
      productsCount: 0,
      firstPageProcessed: 0,
      totalPages: 0,
      backgroundProcessing: false,
    }
  }
}

export default syncProducts
