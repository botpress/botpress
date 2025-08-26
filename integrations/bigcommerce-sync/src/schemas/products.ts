export const PRODUCT_TABLE_SCHEMA = {
  type: 'object',
  properties: {
    product_id: { type: 'number', 'x-zui': { searchable: false } },
    name: { type: 'string', 'x-zui': { searchable: true } },
    sku: { type: 'string', 'x-zui': { searchable: false } },
    price: { type: 'number', 'x-zui': { searchable: false } },
    sale_price: { type: 'number', 'x-zui': { searchable: false } },
    retail_price: { type: 'number', 'x-zui': { searchable: false } },
    total_sold: { type: 'number', 'x-zui': { searchable: false } },
    weight: { type: 'number', 'x-zui': { searchable: false } },
    type: { type: 'string', 'x-zui': { searchable: false } },
    inventory_level: { type: 'number', 'x-zui': { searchable: false } },
    inventory_tracking: { type: 'string', 'x-zui': { searchable: false } },
    brand_name: { type: 'string', 'x-zui': { searchable: true } },
    categories: { type: 'string', 'x-zui': { searchable: true } },
    availability: { type: 'string', 'x-zui': { searchable: false } },
    condition: { type: 'string', 'x-zui': { searchable: false } },
    is_visible: { type: 'boolean', 'x-zui': { searchable: false } },
    sort_order: { type: 'number', 'x-zui': { searchable: false } },
    description: { type: 'string', 'x-zui': { searchable: true } },
    image_url: { type: 'string', 'x-zui': { searchable: false } },
    url: { type: 'string', 'x-zui': { searchable: false } },
  },
  required: ['product_id', 'name'],
}

export const PRODUCTS_TABLE_NAME = 'bigcommerce_products_Table'
