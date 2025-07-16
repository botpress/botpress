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

function processProductsPage(
  products: BigCommerceProduct[] | undefined,
  allProducts: BigCommerceProduct[],
  currentPage: number,
  PRODUCTS_PER_PAGE: number
): { hasMoreProducts: boolean; nextPage: number } {
  if (!products || products.length === 0) {
    return { hasMoreProducts: false, nextPage: currentPage }
  }

  allProducts.push(...products)

  if (products.length < PRODUCTS_PER_PAGE) {
    return { hasMoreProducts: false, nextPage: currentPage }
  }

  return { hasMoreProducts: true, nextPage: currentPage + 1 }
}

async function fetchAllProducts(bigCommerceClient: BigCommerceClient) {
  const allProducts: BigCommerceProduct[] = []
  let currentPage = 1
  let hasMoreProducts = true
  const PRODUCTS_PER_PAGE = 250

  while (hasMoreProducts) {
    const response = await bigCommerceClient.getProducts({
      page: currentPage,
      limit: PRODUCTS_PER_PAGE,
    })

    const { hasMoreProducts: shouldContinue, nextPage } = processProductsPage(
      response.data,
      allProducts,
      currentPage,
      PRODUCTS_PER_PAGE
    )

    hasMoreProducts = shouldContinue
    currentPage = nextPage
  }

  return allProducts
}

const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async (props) => {
  const { client, logger } = props
  const ctx = props.ctx.configuration

  // this client is necessary for table operations
  const getVanillaClient = (client: bp.Client): Client => client._inner
  const botpressVanillaClient = getVanillaClient(client)

  const bigCommerceClient = getBigCommerceClient(ctx)

  try {
    const tableName = PRODUCT_TABLE
    const tableSchema = PRODUCT_TABLE_SCHEMA

    await botpressVanillaClient.getOrCreateTable({
      table: tableName,
      schema: tableSchema,
    })

    const allProducts = await fetchAllProducts(bigCommerceClient)

    if (allProducts.length === 0) {
      logger.forBot().warn('No products found in BigCommerce store')
      return {
        success: true,
        message: 'No products found in BigCommerce store',
        productsCount: 0,
      }
    }

    logger.forBot().info(`Total products fetched: ${allProducts.length}`)

    const categoriesResponse = await bigCommerceClient.getCategories()
    const categoryById: Record<number, string> = {}

    if (categoriesResponse && categoriesResponse.data) {
      categoriesResponse.data.forEach((category: { id: number; name: string }) => {
        categoryById[category.id] = category.name
      })
    }

    const brandsResponse = await bigCommerceClient.getBrands()
    const brandById: Record<number, string> = {}

    if (brandsResponse && brandsResponse.data) {
      brandsResponse.data.forEach((brand: { id: number; name: string }) => {
        brandById[brand.id] = brand.name
      })
    }

    const tableRows = allProducts.map((product: BigCommerceProduct) => {
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
    })

    try {
      logger.forBot().info('Dropping existing products table...')
      await botpressVanillaClient.deleteTable({
        table: tableName,
      })

      await botpressVanillaClient.getOrCreateTable({
        table: tableName,
        schema: tableSchema,
      })
    } catch (error) {
      logger.forBot().warn('Error dropping products table', error)
    }

    const BATCH_SIZE = 50
    const totalRows = tableRows.length
    let processedRows = 0

    while (processedRows < totalRows) {
      const batch = tableRows.slice(processedRows, processedRows + BATCH_SIZE)

      await botpressVanillaClient.createTableRows({
        table: tableName,
        rows: batch,
      })

      processedRows += batch.length
    }

    return {
      success: true,
      message: `Successfully synced ${allProducts.length} products from BigCommerce`,
      productsCount: allProducts.length,
    }
  } catch (error) {
    logger.forBot().error('Error syncing BigCommerce products', error)
    return {
      success: false,
      message: `Error syncing BigCommerce products: ${error instanceof Error ? error.message : String(error)}`,
      productsCount: 0,
    }
  }
}

export default syncProducts
