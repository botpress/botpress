// Define the shared products table schema
export const productsTableSchema = {
  type: 'object',
  properties: {
    product_id: { type: 'number' },
    name: { type: 'string', 'x-zui': { searchable: true } },
    sku: { type: 'string' },
    price: { type: 'number' },
    sale_price: { type: 'number' },
    retail_price: { type: 'number' },
    cost_price: { type: 'number' },
    weight: { type: 'number' },
    type: { type: 'string' },
    inventory_level: { type: 'number' },
    inventory_tracking: { type: 'string' },
    brand_name: { type: 'string', 'x-zui': { searchable: true } },
    categories: { type: 'string', 'x-zui': { searchable: true } },
    availability: { type: 'string' },
    condition: { type: 'string' },
    is_visible: { type: 'boolean' },
    sort_order: { type: 'number' },
    description: { type: 'string', 'x-zui': { searchable: true } },
    image_url: { type: 'string' },
    url: { type: 'string' },
  },
  required: ['product_id', 'name'],
}

// Export the table name as well to ensure consistency
export const productsTableName = 'bigcommerce_products_Table' 