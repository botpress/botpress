export const PRODUCT_TABLE_SCHEMA = {
  type: 'object',
  properties: {
    product_id: { type: 'number' },
    name: { type: 'string', 'x-zui': { searchable: true } },
    sku: { type: 'string' },
    price: { type: 'number' },
    sale_price: { type: 'number' },
    retail_price: { type: 'number' },
    total_sold: { type: 'number' },
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

export const PRODUCTS_TABLE_NAME = 'bigcommerce_products_Table'
