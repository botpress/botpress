import actions from './actions'
import * as bp from '.botpress'
import { Client } from '@botpress/client'
import { getBigCommerceClient } from './client'
import { productsTableSchema, productsTableName } from './schemas/products'

/*
FOR FUTURE PURPOSES:
This is the client that MUST be imported in order to allow table operations
within an integration. Without this, the table operations will cause errors everywhere.
*/
const getBotpressVanillaClient = (client: any): Client => 
  (client as any)._client as Client

/* 
  Helper function to check if a request is from BigCommerce based on headers
*/
const isBigCommerceWebhook = (headers: Record<string, string | string[] | undefined>): boolean => {
  return !!(
    (headers['webhook-id'] && headers['webhook-signature'] && headers['webhook-timestamp']) ||
    Object.keys(headers).some(key => 
      key.toLowerCase().includes('bigcommerce') || 
      key.toLowerCase().includes('bc-webhook')
    )
  );
}

/* 
  Helper function to extract product ID from webhook data
*/
const extractProductId = (webhookData: any): string | undefined => {
  if (webhookData?.data?.id) return webhookData.data.id;
  if (webhookData?.data?.entity_id) return webhookData.data.entity_id;
  if (webhookData?.id) return webhookData.id;
  return undefined;
}

/* 
  Helper function to handle product create/update operations
*/
const handleProductCreateOrUpdate = async (
  productId: string,
  bigCommerceClient: any,
  botpressVanillaClient: Client,
  tableName: string,
  isCreated: boolean,
  logger: any
) => {
  logger.forBot().info(`Fetching product details for ID: ${productId}`);
  
  const productResponse = await bigCommerceClient.getProduct(productId.toString());
  const product = productResponse.data;
  
  if (!product) return null;
  
  // Fetch all categories to map IDs to names
  logger.forBot().info(`Fetching categories to map IDs to names`);
  const categoriesResponse = await bigCommerceClient.getCategories();
  const categoriesMap = new Map();
  
  if (categoriesResponse && categoriesResponse.data) {
    categoriesResponse.data.forEach((category: any) => {
      categoriesMap.set(category.id, category.name);
    });
  }
  
  // Fetch all brands to map IDs to names
  logger.forBot().info(`Fetching brands to map IDs to names`);
  const brandsResponse = await bigCommerceClient.getBrands();
  const brandsMap = new Map();
  
  if (brandsResponse && brandsResponse.data) {
    brandsResponse.data.forEach((brand: any) => {
      brandsMap.set(brand.id, brand.name);
    });
  }
  
  // Map category IDs to names
  const categoryNames = product.categories?.map((categoryId: number) => 
    categoriesMap.get(categoryId) || categoryId.toString()
  ) || [];
  
  const categories = categoryNames.join(',');
  
  // Get brand name from brand ID
  const brandName = product.brand_id ? brandsMap.get(product.brand_id) || product.brand_id.toString() : '';
  
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].url_standard 
    : '';
    
  const productRow = {
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
    description: product.description?.substring(0, 1000) || '',
    image_url: imageUrl,
    url: product.custom_url?.url || '',
  };
  
  // checking if the product already exists in our table
  const { rows } = await botpressVanillaClient.findTableRows({
    table: tableName,
    filter: { product_id: product.id },
  });
  
  if (rows.length > 0 && rows[0]?.id) {
    // this updates the existing product
    logger.forBot().info(`Updating existing product ID: ${productId}`);
    await botpressVanillaClient.updateTableRows({
      table: tableName,
      rows: [{ id: rows[0].id, ...productRow }],
    });
  } else {
    // else insert the new product
    logger.forBot().info(`Creating new product ID: ${productId}`);
    await botpressVanillaClient.createTableRows({
      table: tableName,
      rows: [productRow],
    });
  }
  
  return {
    success: true,
    message: `Product ${productId} ${isCreated ? 'created' : 'updated'} successfully`,
  };
}

/* 
  Helper function to handle product delete operations
*/
const handleProductDelete = async (
  productId: string,
  botpressVanillaClient: Client,
  tableName: string,
  logger: any
) => {
  logger.forBot().info(`Deleting product ID: ${productId}`);
  
  // Convert the productId to a number since it's stored that way in the schema
  const productIdNumber = Number(productId);
  
  const { rows } = await botpressVanillaClient.findTableRows({
    table: tableName,
    filter: { product_id: productIdNumber },
  });
  
  if (rows.length > 0 && rows[0]?.id) {
    // deleting the row pertaining to the product
    await botpressVanillaClient.deleteTableRows({
      table: tableName,
      ids: [rows[0].id],
    });
    
    return {
      success: true,
      message: `Product ${productId} deleted successfully`,
    };
  } else {
    logger.forBot().warn(`Product ID ${productId} not found for deletion`);
    return {
      success: true,
      message: `Product ${productId} not found for deletion`,
    };
  }
}

export default new bp.Integration({
  register: async ({ client, ctx, logger }) => {
    logger.forBot().info('Registering BigCommerce integration')
    
    try {
      const botpressVanillaClient = getBotpressVanillaClient(client)
      
      await botpressVanillaClient.getOrCreateTable({
        table: productsTableName,
        schema: productsTableSchema,
      })
      
      logger.forBot().info('Syncing BigCommerce products...')
      
      try {
        const syncResult = await actions.syncProducts({
          ctx,
          client,
          logger,
          input: {},
        });
        
        logger.forBot().info(`Product sync completed: ${syncResult.message}`);
        
        if (ctx.webhookId) {
          const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`;
          logger.forBot().info(`Setting up BigCommerce webhooks to: ${webhookUrl}`)
          try {
            const bigCommerceClient = getBigCommerceClient(ctx.configuration)
            const webhookResults = await bigCommerceClient.createProductWebhooks(webhookUrl)
            logger.forBot().info('Webhook creation results:', webhookResults)
          } catch (webhookError) {
            logger.forBot().error('Error creating webhooks:', webhookError)
          }
        }
      } catch (syncError) {
        logger.forBot().error('Error syncing products during initialization', syncError)
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
    // guard clause for non-POST requests
    if (req.method !== 'POST') {
      return {
        status: 405,
        body: JSON.stringify({
          success: false, 
          message: 'Method not allowed'
        })
      };
    }
    
    logger.forBot().info('Received webhook from BigCommerce');
    
    try {
      logger.forBot().info('Webhook headers:', JSON.stringify(req.headers));
      
      // checking if this is a BigCommerce webhook
      const isBCWebhook = isBigCommerceWebhook(req.headers);
      logger.forBot().info(`Is BigCommerce webhook based on headers: ${isBCWebhook}`);
      
      // guard clause: if not a BigCommerce webhook, do full sync
      if (!isBCWebhook) {
        logger.forBot().warn('Not a recognized BigCommerce webhook, falling back to full sync');
        const result = await actions.syncProducts({
          ctx,
          client,
          logger,
          input: {},
        });
        
        return {
          status: 200,
          body: JSON.stringify({
            success: result.success,
            message: 'BigCommerce webhook processed (full sync)',
            syncResult: result
          })
        };
      }
      
      // parsing webhook data
      const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      logger.forBot().info('Webhook data:', JSON.stringify(webhookData));
      
      const botpressVanillaClient = getBotpressVanillaClient(client);
      const tableName = productsTableName;
      const bigCommerceClient = getBigCommerceClient(ctx.configuration);
      
      logger.forBot().info('Webhook data structure:', JSON.stringify({
        hasData: !!webhookData?.data,
        dataType: webhookData?.data ? typeof webhookData.data : 'undefined',
        dataKeys: webhookData?.data ? Object.keys(webhookData.data) : [],
        hasScope: !!webhookData?.scope,
        scope: webhookData?.scope
      }));
      
      // extracting scope/event type
      let scope = webhookData?.scope;
      if (!scope && req.headers['x-webhook-event']) {
        scope = req.headers['x-webhook-event'];
      }
      
      // extracting product ID
      const productId = extractProductId(webhookData);
      
      // guard clause: if missing scope or productId, fall back to full sync
      if (!scope || !productId) {
        logger.forBot().warn('Could not extract product ID or event type from webhook, falling back to full sync');
        
        logger.forBot().info('Detailed webhook structure for debugging:', {
          bodyType: typeof req.body,
          bodyKeys: typeof req.body === 'object' ? Object.keys(req.body) : [],
          headerKeys: Object.keys(req.headers),
          hasProductId: !!productId,
          hasScope: !!scope,
          payloadSample: JSON.stringify(webhookData).substring(0, 500)
        });
        
        const result = await actions.syncProducts({
          ctx,
          client,
          logger,
          input: {},
        });
        
        return {
          status: 200,
          body: JSON.stringify({
            success: result.success,
            message: 'Full sync performed (fallback)',
            syncResult: result
          })
        };
      }
      
      logger.forBot().info(`Processing event: ${scope} for product ID: ${productId}`);
      
      // format variations --> i did this bc I was getting errors within the scope and couldn't be bothered
      const normalizedScope = scope.toLowerCase();
      const isCreated = normalizedScope.includes('created') || normalizedScope.includes('create');
      const isUpdated = normalizedScope.includes('updated') || normalizedScope.includes('update');
      const isDeleted = normalizedScope.includes('deleted') || normalizedScope.includes('delete');
      
      let result;
      
      try {
        if (isCreated || isUpdated) {
          result = await handleProductCreateOrUpdate(
            productId.toString(),
            bigCommerceClient,
            botpressVanillaClient,
            tableName,
            isCreated,
            logger
          );
        } else if (isDeleted) {
          result = await handleProductDelete(
            productId.toString(),
            botpressVanillaClient,
            tableName,
            logger
          );
        } else {
          // Unrecognized event type = fall back to full sync
          logger.forBot().warn(`Unrecognized event type: ${scope}, falling back to full sync`);
          result = await actions.syncProducts({
            ctx,
            client,
            logger,
            input: {},
          });
          result.message = 'Full sync performed (unrecognized event type)';
        }
        
        return {
          status: 200,
          body: JSON.stringify({
            success: result?.success || false,
            message: result?.message || 'Webhook processed',
            ...result
          })
        };
      } catch (error) {
        logger.forBot().error(`Error processing ${scope} for product ${productId}:`, error);
        throw error;
      }
    } catch (error) {
      logger.forBot().error('Error processing webhook:', error)
      return {
        status: 500,
        body: JSON.stringify({
          success: false, 
          message: `Error processing webhook: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }
  },
}) 