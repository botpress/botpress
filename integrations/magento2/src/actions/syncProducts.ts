import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import * as bp from '.botpress'
import { ProductAttributeSchema, ProductListSchema, StockItemSchema, ReviewsArraySchema, ProductData, ReviewData } from '../misc/zod-schemas'

function toMagentoAttributeCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')         // spaces to underscores
    .replace(/[^a-z0-9_]/g, '');  // remove non-alphanumeric/underscore
}

export const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async ({ ctx, input, logger }) => {
  logger.forBot().info('Starting Magento2 product sync')
  
  const { 
    magento_domain, 
    consumer_key, 
    consumer_secret, 
    access_token, 
    access_token_secret, 
    user_agent,
    botpress_pat
  } = ctx.configuration

  const { table_name, custom_attributes, filters_json } = input

  logger.forBot().info(`Configuration: domain=${magento_domain}, table_name=${table_name}`)

  const oauth = new OAuth({
    consumer: {
      key: consumer_key,
      secret: consumer_secret,
    },
    signature_method: 'HMAC-SHA256',
    hash_function(baseString: string, key: string) {
      return crypto.createHmac('sha256', key).update(baseString).digest('base64')
    },
  })

  const token = {
    key: access_token,
    secret: access_token_secret,
  }

  const defaultUserAgent = 'Botpress-Magento2-Integration/1.0'
  const headers = {
    'User-Agent': user_agent || defaultUserAgent,
    'accept': 'application/json',
  }

  // Botpress Tables API setup
  const apiBaseUrl = 'https://api.botpress.cloud/v1/tables'
  const httpHeaders = {
    'Authorization': `bearer ${botpress_pat}`,
    'x-bot-id': ctx.botId,
    'Content-Type': 'application/json',
  }

  try {
    // Parse custom attributes
    const customAttributeCodes = (custom_attributes || '')
      .split(',')
      .map((attr: string) => toMagentoAttributeCode(attr))
      .filter((attr: string) => attr.length > 0)

    logger.forBot().info(`Custom attributes to sync: ${customAttributeCodes.join(', ')}`)

    // Build search criteria from JSON filters
    const pageSize = 500 // Increased page size for better performance
    let baseSearchCriteria = `searchCriteria[pageSize]=${pageSize}`
    let filterCriteria = ''
    

    if (filters_json) {
      try {
        let filters = JSON.parse(filters_json)
        if (!Array.isArray(filters)) {
          return {
            success: false,
            synced_count: 0,
            total_count: 0,
            table_name,
            error: 'filters_json must be a JSON array'
          }
        }

        // Step 1: Collect unique attribute fields that are not standard fields
        const standardFields = ['sku', 'name', 'description', 'price', 'original_price', 'currency', 'image_url', 'thumbnail_url', 'stock_qty', 'is_in_stock', 'average_rating', 'review_count']
        const attributeFields = Array.from(new Set(filters.map((f: any) => f.field).filter((f: string) => f && !standardFields.includes(f))))

        // Step 2: Fetch attribute mappings for those fields
        const attributeMappings: Record<string, Record<string, string>> = {}
        for (const attrCode of attributeFields) {
          try {
            const attrUrl = `https://${magento_domain}/rest/default/V1/products/attributes/${attrCode}`
            const attrRequestData = {
              url: attrUrl,
              method: 'GET',
            }
            const attrAuthHeader = oauth.toHeader(oauth.authorize(attrRequestData, token))
            const attrResponse = await axios({
              method: 'GET',
              url: attrUrl,
              headers: {
                ...attrAuthHeader,
                ...headers,
              },
            })
            const attribute = ProductAttributeSchema.parse(attrResponse.data)
            if (attribute.options && attribute.options.length > 0) {
              attributeMappings[attrCode] = {}
              for (const option of attribute.options) {
                attributeMappings[attrCode][option.label] = option.value
              }
              logger.forBot().info(`Fetched ${attribute.options.length} options for attribute ${attrCode}`)
            }
          } catch (error) {
            logger.forBot().warn(`Failed to get attribute mapping for ${attrCode}:`, error)
          }
        }

        // Step 3: Replace filter values that match a label with the corresponding value/code
        filters = filters.map((filter: any) => {
          if (
            filter.field !== undefined &&
            filter.value !== undefined &&
            attributeMappings[filter.field]?.[filter.value] !== undefined
          ) {
            return { ...filter, value: attributeMappings[filter.field]?.[filter.value] }
          }
          return filter
        })

        // Step 4: Build the filter criteria
        const filterGroups: string[] = []
        filters.forEach((filter: any, idx: number) => {
          if (!filter.field || !filter.condition) return
          const filterGroup = `searchCriteria[filterGroups][${idx}][filters][0][field]=${encodeURIComponent(filter.field)}&searchCriteria[filterGroups][${idx}][filters][0][conditionType]=${filter.condition}`
          if (filter.value && filter.condition !== 'notnull' && filter.condition !== 'null') {
            filterGroups.push(`${filterGroup}&searchCriteria[filterGroups][${idx}][filters][0][value]=${encodeURIComponent(filter.value)}`)
          } else {
            filterGroups.push(filterGroup)
          }
        })
        if (filterGroups.length > 0) {
          filterCriteria = filterGroups.join('&')
        }
      } catch (err) {
        return {
          success: false,
          synced_count: 0,
          total_count: 0,
          table_name,
          error: `filters_json is not valid JSON: ${err instanceof Error ? err.message : 'Unknown parsing error'}`
        }
      }
    }

    // Fetch all products using pagination
    const allProducts: ProductData[] = []
    let currentPage = 1
    let totalCount = 0
    let hasMorePages = true

    logger.forBot().info(`Starting paginated product fetch...`)

    while (hasMorePages) {
      const searchCriteria = `${baseSearchCriteria}&searchCriteria[currentPage]=${currentPage}${filterCriteria ? `&${filterCriteria}` : ''}`
      const productsUrl = `https://${magento_domain}/rest/default/V1/products?${searchCriteria}`
      
      logger.forBot().info(`Fetching page ${currentPage} from: ${productsUrl}`)
      
      const productsRequestData = {
        url: productsUrl,
        method: 'GET',
      }
      const productsAuthHeader = oauth.toHeader(oauth.authorize(productsRequestData, token))
      
      const productsResponse = await axios({
        method: 'GET',
        url: productsUrl,
        headers: {
          ...productsAuthHeader,
          ...headers,
        },
      })

      try {
        const parsed = ProductListSchema.parse(productsResponse.data)
        const pageProducts = parsed.items
        const pageTotalCount = parsed.total_count
        
        // Set total count on first page
        if (currentPage === 1) {
          totalCount = pageTotalCount
          logger.forBot().info(`Total products available: ${totalCount}`)
        }

        allProducts.push(...pageProducts)
        logger.forBot().info(`Fetched ${pageProducts.length} products from page ${currentPage} (total fetched so far: ${allProducts.length}/${totalCount})`)

        // Check if there are more pages
        hasMorePages = pageProducts.length === pageSize && allProducts.length < totalCount
        currentPage++
      } catch (err) {
        logger.forBot().error('Invalid product list API response', err)
        throw err
      }
    }

    logger.forBot().info(`Completed product fetch: ${allProducts.length} products retrieved from ${currentPage - 1} pages`)
    const products = allProducts
    
    // Log completion status for autonomous operation
    if (totalCount > allProducts.length) {
      const remainingProducts = totalCount - allProducts.length
      logger.forBot().info(`Autonomous sync completed: ${allProducts.length}/${totalCount} products processed. ${remainingProducts} products remaining for next scheduled run.`)
    } else {
      logger.forBot().info(`Autonomous sync completed: All ${totalCount} products processed successfully.`)
    }
    


    logger.forBot().info(`Found ${products.length} products (total: ${totalCount})`)

    // --- Botpress Tables API setup and table creation ---
    logger.forBot().info(`Setting up Botpress table: ${table_name}`)

    // 1. Lookup table by name
    logger.forBot().info('Looking up existing table')
    const listTablesResponse = await axios.get(apiBaseUrl, { headers: httpHeaders })
    const existingTables = listTablesResponse.data.tables || []
    let foundTable = existingTables.find((t: { id: string; name: string }) => t.name === table_name)

    let tableId = ''
    let tableSchema: any = null

    if (!foundTable) {
      // Create table with default schema
      logger.forBot().info(`Table ${table_name} not found. Creating it with default schema.`)
      
      // Build default schema with standard columns
      const defaultProperties: Record<string, { type: string }> = {
        sku: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        original_price: { type: 'number' },
        currency: { type: 'string' },
        image_url: { type: 'string' },
        thumbnail_url: { type: 'string' },
        stock_qty: { type: 'number' },
        is_in_stock: { type: 'boolean' },
        average_rating: { type: 'number' },
        review_count: { type: 'number' },
      }

      // Add custom attribute columns
      for (const attrCode of customAttributeCodes) {
        defaultProperties[attrCode] = { type: 'string' }
      }

      // Check column limit (max 20 columns)
      const totalColumns = Object.keys(defaultProperties).length
      if (totalColumns > 20) {
        logger.forBot().error(`Too many columns: ${totalColumns}. The maximum allowed is 20. Reduce the number of custom attributes.`)
        return {
          success: false,
          synced_count: 0,
          total_count: 0,
          table_name,
          error: `Too many columns: ${totalColumns}. The maximum allowed is 20. Reduce the number of custom attributes.`
        }
      }

      const createTablePayload = {
        name: table_name,
        schema: {
          type: 'object',
          properties: defaultProperties
        }
      }

      try {
        logger.forBot().info(`Creating table ${table_name} with schema: ${JSON.stringify(createTablePayload.schema)}`)
        const createTableResponse = await axios.post(apiBaseUrl, createTablePayload, { headers: httpHeaders })
        
        if (!createTableResponse.data?.table?.id) {
          throw new Error('Failed to get table ID from creation response')
        }
        
        tableId = createTableResponse.data.table.id
        tableSchema = createTableResponse.data.table.schema
        logger.forBot().info(`Table ${table_name} created successfully with ID: ${tableId}`)
      } catch (error) {
        logger.forBot().error(`Failed to create table ${table_name}:`, error)
        return {
          success: false,
          synced_count: 0,
          total_count: 0,
          table_name,
          error: `Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      }
    } else {
      // Use existing table
      tableId = foundTable.id
      logger.forBot().info(`Found existing table ${table_name} (ID: ${tableId}), fetching schema`)
      
      try {
        const tableDetailsResponse = await axios.get(`${apiBaseUrl}/${tableId}`, { headers: httpHeaders })
        tableSchema = tableDetailsResponse.data.table?.schema
        logger.forBot().info(`Table schema: ${JSON.stringify(tableSchema)}`)
      } catch (error) {
        logger.forBot().error(`Failed to fetch table schema: ${error}`)
        return {
          success: false,
          synced_count: 0,
          total_count: 0,
          table_name,
          error: `Failed to fetch table schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      }

      if (!tableSchema?.properties) {
        logger.forBot().error('Table schema is invalid or missing properties')
        return {
          success: false,
          synced_count: 0,
          total_count: 0,
          table_name,
          error: 'Table schema is invalid or missing properties',
        }
      }
    }

    // Get available columns from schema
    const availableColumns = Object.keys(tableSchema.properties)
    logger.forBot().info(`Available columns in table: ${availableColumns.join(', ')}`)

    // Validate that required columns exist
    const requiredColumns = ['sku', 'name', 'price']
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col))
    if (missingColumns.length > 0) {
      logger.forBot().error(`Missing required columns: ${missingColumns.join(', ')}`)
      return {
        success: false,
        synced_count: 0,
        total_count: 0,
        table_name,
        error: `Missing required columns: ${missingColumns.join(', ')}`,
      }
    }

    // Always clear all rows before inserting or returning
    logger.forBot().info(`Clearing existing rows from table ${table_name}`)
    await axios.post(`${apiBaseUrl}/${tableId}/rows/delete`, { deleteAllRows: true }, { headers: httpHeaders })
    logger.forBot().info('Successfully cleared existing rows')

    if (products.length === 0) {
      logger.forBot().warn('No products found to sync')
      return {
        success: true,
        synced_count: 0,
        total_count: totalCount,
        table_name,
      }
    }

    // Get attribute mappings for custom attributes
    const attributeMappings: Record<string, Record<string, string>> = {}
    
    if (customAttributeCodes.length > 0) {
      logger.forBot().info('Fetching attribute mappings for custom attributes')
      
      for (const attrCode of customAttributeCodes) {
        try {
          const attrUrl = `https://${magento_domain}/rest/default/V1/products/attributes/${attrCode}`
          const attrRequestData = {
            url: attrUrl,
            method: 'GET',
          }
          const attrAuthHeader = oauth.toHeader(oauth.authorize(attrRequestData, token))
          
          const attrResponse = await axios({
            method: 'GET',
            url: attrUrl,
            headers: {
              ...attrAuthHeader,
              ...headers,
            },
            timeout: 15000, // 15 second timeout
          })

          const attribute = ProductAttributeSchema.parse(attrResponse.data)
          if (attribute.options && attribute.options.length > 0) {
            attributeMappings[attrCode] = {}
            for (const option of attribute.options) {
              attributeMappings[attrCode][option.value] = option.label
            }
            logger.forBot().info(`Mapped ${attribute.options.length} options for attribute ${attrCode}`)
          }
        } catch (error) {
          let errorMessage = `Failed to get attribute mapping for ${attrCode}`
          
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
              errorMessage = `Custom attribute "${attrCode}" not found in Magento. Please check the attribute name or remove it from custom_attributes.`
            } else {
              errorMessage = `Failed to get attribute mapping for ${attrCode}: HTTP ${error.response?.status} - ${error.response?.data?.message || error.message}`
            }
          } else {
            errorMessage = `Failed to get attribute mapping for ${attrCode}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
          
          logger.forBot().error(errorMessage, error)
          
          return {
            success: false,
            synced_count: 0,
            total_count: 0,
            table_name,
            error: errorMessage
          }
        }
      }
    }

    // Process products in parallel batches for maximum performance
    const rowsToInsert: any[] = []
    const failedProducts: string[] = []
    const BATCH_SIZE = 50 // Process 50 products simultaneously - aggressive parallelization for maximum performance
    logger.forBot().info(`Processing ${products.length} products in parallel batches of ${BATCH_SIZE}...`)
    
    // Helper function to process a single product
    const processProduct = async (product: ProductData, index: number): Promise<any> => {
      try {
        logger.forBot().debug(`Processing product ${index + 1}/${products.length}: ${product.sku}`)
        
        // Get stock information and reviews in parallel for better performance
        let stockQty = 0
        let isInStock = false
        let averageRating = 0
        let reviewCount = 0
        
        // Try to get stock from extension_attributes first (faster)
        if (product.extension_attributes?.stock_item) {
          stockQty = product.extension_attributes.stock_item.qty || 0
          isInStock = product.extension_attributes.stock_item.is_in_stock || false
        } else {
          // Need to fetch stock via API - will be done in parallel below
        }
        
        // Prepare parallel API calls for stock and reviews
        const apiCalls: Promise<any>[] = []
        const callStartTime = Date.now()
        
        // Add stock API call if needed
        if (!product.extension_attributes?.stock_item) {
          const stockUrl = `https://${magento_domain}/rest/default/V1/stockItems/${encodeURIComponent(product.sku)}`
          const stockRequestData = {
            url: stockUrl,
            method: 'GET',
          }
          const stockAuthHeader = oauth.toHeader(oauth.authorize(stockRequestData, token))
          
          const stockPromise = axios({
            method: 'GET',
            url: stockUrl,
            headers: {
              ...stockAuthHeader,
              ...headers,
            },
            timeout: 10000, // 10 second timeout
          }).then(response => {
            const stockData = StockItemSchema.parse(response.data)
            stockQty = stockData.qty
            isInStock = stockData.is_in_stock
            return { type: 'stock', data: stockData }
          }).catch(error => ({ type: 'stock', error }))
          
          apiCalls.push(stockPromise)
        }
        
        // Add reviews API call
        const reviewsUrl = `https://${magento_domain}/rest/default/V1/products/${encodeURIComponent(product.sku)}/reviews`
        logger.forBot().info(`[REVIEWS API] SKU: ${product.sku} | URL: ${reviewsUrl}`)
        const reviewsRequestData = {
          url: reviewsUrl,
          method: 'GET',
        }
        const reviewsAuthHeader = oauth.toHeader(oauth.authorize(reviewsRequestData, token))
        
        const reviewsPromise = axios({
          method: 'GET',
          url: reviewsUrl,
          headers: {
            ...reviewsAuthHeader,
            ...headers,
          },
          timeout: 10000, // 10 second timeout
        })
        .then(response => {
          let reviews: ReviewData[] = []
          try {
            reviews = ReviewsArraySchema.parse(response.data)
          } catch (err) {
            logger.forBot().warn(`[REVIEWS API] Invalid response for SKU: ${product.sku}`, err)
            reviews = []
          }
          return { type: 'reviews', data: reviews }
        })
        .catch(error => {
          if (axios.isAxiosError(error)) {
            logger.forBot().error(`[REVIEWS API ERROR] SKU: ${product.sku} | URL: ${reviewsUrl} | Status: ${error.response?.status} | Response: ${JSON.stringify(error.response?.data)}`)
          } else {
            logger.forBot().error(`[REVIEWS API ERROR] SKU: ${product.sku} | URL: ${reviewsUrl} | Error: ${error}`)
          }
          return { type: 'reviews', error }
        })
        
        apiCalls.push(reviewsPromise)
        
        // Execute all API calls in parallel
        if (apiCalls.length > 0) {
          logger.forBot().debug(`Making ${apiCalls.length} parallel API calls for ${product.sku}`)
          
          try {
            const results = await Promise.all(apiCalls)
            const callEndTime = Date.now()
            const totalDuration = callEndTime - callStartTime
            
            logger.forBot().debug(`Parallel API calls for ${product.sku} completed in ${totalDuration}ms`)
            
            // Process results
            for (const result of results) {
              if (result.type === 'stock') {
                if (result.error) {
                  logger.forBot().warn(`Failed to get stock info for ${product.sku}:`, result.error)
                  stockQty = 0
                  isInStock = false
                } else {
                  stockQty = result.data.qty || 0
                  isInStock = result.data.is_in_stock || false
                  logger.forBot().debug(`Stock data for ${product.sku}: Qty=${stockQty}, InStock=${isInStock}`)
                }
              } else if (result.type === 'reviews') {
                if (result.error) {
                  if (axios.isAxiosError(result.error)) {
                    logger.forBot().warn(
                      `Failed to get reviews for ${product.sku}: ${result.error.message} (status: ${result.error.response?.status})`
                    )
                  } else {
                    logger.forBot().warn(`Failed to get reviews for ${product.sku}:`, result.error)
                  }
                  reviewCount = 0
                  averageRating = 0
                } else {
                  const reviews: ReviewData[] = result.data || []
                  reviewCount = reviews.length
                  
                  if (reviewCount > 0) {
                    const totalRating = reviews.reduce((sum, review) => {
                      const ratingObj = Array.isArray(review.ratings) && review.ratings.length > 0 ? review.ratings[0] : null
                      const rating = ratingObj ? Number(ratingObj.value) : 0
                      return sum + (isNaN(rating) ? 0 : rating)
                    }, 0)
                    averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0
                  }
                  logger.forBot().debug(`Reviews data for ${product.sku}: Count=${reviewCount}, AvgRating=${averageRating}`)
                }
              }
            }
            
            // Log slow parallel calls
            if (totalDuration > 3000) {
              logger.forBot().warn(`Slow parallel API calls for ${product.sku}: ${totalDuration}ms`)
            }
          } catch (error) {
            const callEndTime = Date.now()
            const totalDuration = callEndTime - callStartTime
            logger.forBot().error(`Failed parallel API calls for ${product.sku} after ${totalDuration}ms:`, error)
            // Use defaults if all calls fail
            stockQty = 0
            isInStock = false
            reviewCount = 0
            averageRating = 0
          }
        }

        // Get images
        let imageUrl = ''
        let thumbnailUrl = ''
        
        const mainImage = product.media_gallery_entries?.[0]
        if (mainImage?.file) {
          imageUrl = `https://${magento_domain}/media/catalog/product${mainImage.file}`
          thumbnailUrl = imageUrl
        }

        // Build row directly based on available columns
        const row: any = {}
        
        // Only include columns that exist in the table schema
        for (const columnName of availableColumns) {
          let value: any = null
          
          // Map column names to product data
          const productDataMap: Record<string, any> = {
            sku: product.sku || '',
            name: product.name || '',
            description: product.description || '',
            price: product.price || 0,
            original_price: product.original_price || product.price || 0,
            currency: 'USD', // You might want to make this configurable
            image_url: imageUrl || '',
            thumbnail_url: thumbnailUrl || '',
            stock_qty: stockQty,
            is_in_stock: isInStock,
            average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
            review_count: reviewCount,
          }
          
          // Get value from product data map
          value = productDataMap[columnName]
          
          // Handle custom attributes if this column is one of the requested custom attributes
          if (!value && customAttributeCodes.includes(columnName) && product.custom_attributes) {
            const attr = product.custom_attributes.find(a => a.attribute_code === columnName)
            if (attr) {
              value = attr.value
              // Map value to label if mapping exists
              if ((typeof attr.value === 'string' || typeof attr.value === 'number') && attributeMappings[attr.attribute_code]?.[attr.value] !== undefined) {
                value = attributeMappings[attr.attribute_code]?.[attr.value]
              } else if (Array.isArray(attr.value) && attributeMappings[attr.attribute_code]) {
                value = attr.value
                  .map((v: any) => attributeMappings[attr.attribute_code]?.[v] ?? v)
                  .join(', ')
              }
              logger.forBot().debug(`Set ${columnName} = ${String(value ?? '')} for product ${product.sku}`)
            }
          }
          
          if (value !== undefined && value !== null) {
            // Convert to appropriate type based on schema
            const columnType = tableSchema.properties[columnName]?.type
            if (columnType === 'number') {
              const numValue = Number(value)
              row[columnName] = isNaN(numValue) ? value : numValue
            } else if (columnType === 'boolean') {
              row[columnName] = Boolean(value)
            } else {
              row[columnName] = String(value ?? '')
            }
          } else {
            // Set default values based on column type
            const columnType = tableSchema.properties[columnName]?.type
            if (columnType === 'number') {
              row[columnName] = null
            } else if (columnType === 'boolean') {
              row[columnName] = false
            } else {
              row[columnName] = ''
            }
          }
        }
        
        logger.forBot().debug(`Successfully processed product ${product.sku} for table insertion`)
        return row
      } catch (error) {
        const errorMsg = `Failed to process product ${product.sku ?? ''}: ${error instanceof Error ? error.message : 'Unknown error'}`
        logger.forBot().error(errorMsg, error)
        failedProducts.push(`${product.sku ?? 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        
        // Log additional error details for debugging
        if (error instanceof Error) {
          logger.forBot().error(`Error stack: ${error.stack}`)
        }
        if (axios.isAxiosError(error)) {
          logger.forBot().error(`HTTP Status: ${error.response?.status}, Response: ${JSON.stringify(error.response?.data)}`)
        }
        return null
      }
    }
    
    // Process products in parallel batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batchStart = i
      const batchEnd = Math.min(i + BATCH_SIZE, products.length)
      const batch = products.slice(batchStart, batchEnd)
      
      // Log progress
      const progressPercent = ((i / products.length) * 100).toFixed(1)
      logger.forBot().info(`=== PROGRESS UPDATE: Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)} (${progressPercent}%) ===`)
      logger.forBot().info(`Processing products ${batchStart + 1}-${batchEnd} of ${products.length} in parallel`)
      
      // Process batch in parallel
      const batchStartTime = Date.now()
      const batchPromises = batch.map((product, batchIndex) => 
        processProduct(product, batchStart + batchIndex)
      )
      
      try {
        const batchResults = await Promise.all(batchPromises)
        const batchEndTime = Date.now()
        const batchDuration = batchEndTime - batchStartTime
        
        // Add successful results to rowsToInsert
        const successfulRows = batchResults.filter(row => row !== null)
        rowsToInsert.push(...successfulRows)
        
        logger.forBot().info(`Batch completed in ${batchDuration}ms: ${successfulRows.length}/${batch.length} products processed successfully`)
        
        // Log slow batches
        if (batchDuration > 15000) { // 15 seconds
          logger.forBot().warn(`Slow batch processing: ${batchDuration}ms for ${batch.length} products`)
        }
        
      } catch (error) {
        logger.forBot().error(`Failed to process batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
        // Continue with next batch instead of failing completely
      }
    }

    logger.forBot().info(`=== PROCESSING PHASE COMPLETE ===`)
    logger.forBot().info(`Successfully processed ${rowsToInsert.length} products`)
    logger.forBot().info(`rowsToInsert array length: ${rowsToInsert.length}`)
    logger.forBot().info(`Sample of first row: ${JSON.stringify(rowsToInsert[0] || 'no rows')}`)
    
    if (failedProducts.length > 0) {
      logger.forBot().warn(`Failed to process ${failedProducts.length} products: ${failedProducts.join(', ')}`)
    }
    
    logger.forBot().info(`About to start insertion phase...`)

    // Only insert if there are products to insert
    logger.forBot().info(`Checking if rowsToInsert.length > 0: ${rowsToInsert.length > 0}`)
    if (rowsToInsert.length > 0) {
      logger.forBot().info(`Entering insertion block`)
      try {
        // Create rows in the table with batching
        const BATCH_SIZE = 50;
        const totalRows = rowsToInsert.length;
        let processedRows = 0;

        logger.forBot().info(`Starting batch insertion of ${totalRows} products into table "${table_name}"`)

        while (processedRows < totalRows) {
          const batch = rowsToInsert.slice(processedRows, processedRows + BATCH_SIZE);
          try {
            await axios.post(`${apiBaseUrl}/${tableId}/rows`, { rows: batch }, { headers: httpHeaders });
            processedRows += batch.length;
            logger.forBot().info(`Processed ${processedRows}/${totalRows} rows for table "${table_name}"`);
          } catch (batchError) {
            const errorMsg = `Failed to insert batch ${Math.floor(processedRows / BATCH_SIZE) + 1} (rows ${processedRows + 1}-${Math.min(processedRows + BATCH_SIZE, totalRows)}): ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
            logger.forBot().error(errorMsg, batchError)
            
            if (axios.isAxiosError(batchError)) {
              logger.forBot().error(`Batch insertion HTTP Status: ${batchError.response?.status}, Response: ${JSON.stringify(batchError.response?.data)}`)
            }
            throw batchError; // Re-throw to stop processing
          }
        }
        
        logger.forBot().info(`Successfully populated table "${table_name}" with ${rowsToInsert.length} rows`);
      } catch (insertError) {
        logger.forBot().error(`Failed to insert products into table "${table_name}": ${insertError instanceof Error ? insertError.message : 'Unknown error'}`, insertError)
        throw insertError; // Re-throw to be caught by outer try-catch
      }
    } else {
      logger.forBot().warn('No products to insert into table')
      logger.forBot().warn(`rowsToInsert.length is ${rowsToInsert.length}`)
    }

    logger.forBot().info(`Sync completed successfully: ${rowsToInsert.length} products synced to table ${table_name}`)

    return {
      success: true,
      synced_count: rowsToInsert.length,
      total_count: totalCount,
      table_name: table_name,
    }
  } catch (error) {
    const errorMsg = `Product sync failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
    logger.forBot().error(errorMsg, error)
    
    // Log additional error details
    if (error instanceof Error) {
      logger.forBot().error(`Error stack: ${error.stack}`)
    }
    if (axios.isAxiosError(error)) {
      logger.forBot().error(`HTTP Status: ${error.response?.status}, Response: ${JSON.stringify(error.response?.data)}`)
    }
    
    return {
      success: false,
      synced_count: 0,
      total_count: 0,
      table_name: table_name,
      error: errorMsg,
    }
  }
}