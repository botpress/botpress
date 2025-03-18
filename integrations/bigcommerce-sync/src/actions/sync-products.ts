import { Client } from '@botpress/client'
import * as bp from '.botpress'
import { z } from '@botpress/sdk'
import { getBigCommerceClient } from '../client'
import { productsTableSchema, productsTableName } from '../schemas/products'

const syncProducts = async ({ 
  ctx, 
  client, 
  logger, 
  input 
}: any) => {
  /* 
  FOR FUTURE PURPOSES:
  This is the client that MUST be imported in order to allow table operations
  within an integration. Without this, the table operations will cause errors everywhere.
  */
  const botpressVanillaClient = (client as any)._client as Client

  // Getting the BigCommerce client
  const bigCommerceClient = getBigCommerceClient(ctx.configuration)
  
  try {
    /*
    FOR FUTURE PURPOSES (SO YOU DON'T STRUGGLE LIKE I DID):
    The table name MUST NOT START WITH A NUMBER.
    Also, it must end with 'Table'.
    (you should have better logging than I did when building this to catch this early)
    */
    const tableName = productsTableName
    
    // Note: max 20 columns per botpress table.
    const tableSchema = productsTableSchema
    
    // As you can see, we can use the getOrCreateTable operation from botpress after using botpressVanillaClient.
    await botpressVanillaClient.getOrCreateTable({
      table: tableName,
      schema: tableSchema,
    })
    
    // Fetching products from BigCommerce
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
    
    // Fetch all categories to map IDs to names
    logger.forBot().info('Fetching categories to map IDs to names...')
    const categoriesResponse = await bigCommerceClient.getCategories()
    const categoriesMap = new Map()
    
    if (categoriesResponse && categoriesResponse.data) {
      categoriesResponse.data.forEach((category: any) => {
        categoriesMap.set(category.id, category.name)
      })
    }
    
    // Fetch all brands to map IDs to names
    logger.forBot().info('Fetching brands to map IDs to names...')
    const brandsResponse = await bigCommerceClient.getBrands()
    const brandsMap = new Map()
    
    if (brandsResponse && brandsResponse.data) {
      brandsResponse.data.forEach((brand: any) => {
        brandsMap.set(brand.id, brand.name)
      })
    }
    
    // Transform products for table insertion
    // Only include fields that match our schema (max 20 columns)
    const tableRows = products.map((product: any) => {
      // Map category IDs to names
      const categoryNames = product.categories?.map((categoryId: number) => 
        categoriesMap.get(categoryId) || categoryId.toString()
      ) || []
      
      const categories = categoryNames.join(',')
      
      // Get brand name from brand ID
      const brandName = product.brand_id ? brandsMap.get(product.brand_id) || product.brand_id.toString() : '';
      
      const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].url_standard 
        : ''
        
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
        categories: categories,
        availability: product.availability,
        condition: product.condition,
        is_visible: product.is_visible,
        sort_order: product.sort_order,
        description: product.description?.substring(0, 1000) || '', // Limit description length
        image_url: imageUrl,
        url: product.custom_url?.url || '',
      }
    })
    
    // My syncing is a deletion-insertion sync. Might not be most optimal.
    try {
      logger.forBot().info('Dropping existing products table...')

      await botpressVanillaClient.deleteTable({
        table: tableName
      })
      
      await botpressVanillaClient.getOrCreateTable({
        table: tableName,
        schema: tableSchema,
      })
    } catch (error) {
      // Table might not exist yet
      logger.forBot().warn('Error dropping products table', error)
      // Continue with the sync process anyways
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