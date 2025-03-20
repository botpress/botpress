import { Client } from '@botpress/client'
import { getBigCommerceClient } from '../client'
import { productsTableSchema, productsTableName } from '../schemas/products'
import * as bp from '.botpress'

type BigCommerceProduct = {
  id: number
  name: string
  sku?: string
  price?: number
  sale_price?: number
  retail_price?: number
  cost_price?: number
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
  images?: Array<{ url_standard: string }>
  custom_url?: { url: string }
}

const syncProducts = async (props: bp.HandlerProps<'syncProducts'>) => {
  const { client, logger } = props
  const ctx = props.ctx.configuration

  // this client is necessary for table operations
  const getVaniallaClient = (botClient: bp.Client): Client => (botClient as any)._client as Client
  const botpressVanillaClient = getVaniallaClient(client)

  const bigCommerceClient = getBigCommerceClient(ctx)

  try {
    const tableName = productsTableName

    const tableSchema = productsTableSchema

    await botpressVanillaClient.getOrCreateTable({
      table: tableName,
      schema: tableSchema,
    })

    logger.forBot().info('Fetching products from BigCommerce...')
    const response = await bigCommerceClient.getProducts()
    const products = response.data

    if (!products || products.length === 0) {
      logger.forBot().warn('No products found in BigCommerce store')
      return {
        success: true,
        message: 'No products found in BigCommerce store',
        productsCount: 0,
      }
    }

    logger.forBot().info('Fetching categories to map IDs to names...')
    const categoriesResponse = await bigCommerceClient.getCategories()
    const categoryById: Record<number, string> = {}

    if (categoriesResponse && categoriesResponse.data) {
      categoriesResponse.data.forEach((category: { id: number; name: string }) => {
        categoryById[category.id] = category.name
      })
    }

    logger.forBot().info('Fetching brands to map IDs to names...')
    const brandsResponse = await bigCommerceClient.getBrands()
    const brandById: Record<number, string> = {}

    if (brandsResponse && brandsResponse.data) {
      brandsResponse.data.forEach((brand: { id: number; name: string }) => {
        brandById[brand.id] = brand.name
      })
    }

    const tableRows = products.map((product: BigCommerceProduct) => {
      const categoryNames =
        product.categories?.map((categoryId: number) => categoryById[categoryId] || categoryId.toString()) || []

      const categories = categoryNames.join(',')

      const brandName = product.brand_id ? brandById[product.brand_id] || product.brand_id.toString() : ''

      const imageUrl = product.images && product.images.length > 0 ? product.images[0]?.url_standard || '' : ''

      return {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        sale_price: product.sale_price,
        retail_price: product.retail_price,
        cost_price: product.cost_price,
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
        description: product.description?.substring(0, 1000) || '',
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

    logger.forBot().info(`Inserting ${tableRows.length} products...`)
    await botpressVanillaClient.createTableRows({
      table: tableName,
      rows: tableRows,
    })

    return {
      success: true,
      message: `Successfully synced ${products.length} products from BigCommerce`,
      productsCount: products.length,
    }
  } catch (error) {
    logger.forBot().error('Error syncing products', error)
    return {
      success: false,
      message: `Error syncing products: ${error instanceof Error ? error.message : String(error)}`,
      productsCount: 0,
    }
  }
}

export default syncProducts
