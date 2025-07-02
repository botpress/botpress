# Magento 2 (Adobe Commerce) Integration for Botpress

## Overview

This Botpress integration allows seamless interaction with **Magento 2 (Adobe Commerce)** to fetch product information, stock data, and sync products to Botpress tables. Perfect for e-commerce chatbots that need real-time product data and inventory management.

## Features

- **Product Management:** Retrieve products with flexible search criteria
- **Stock Information:** Get real-time stock levels and availability
- **Data Synchronization:** Sync products to Botpress tables with automatic schema creation
- **Custom Attributes:** Support for custom product attributes
- **Advanced Filtering:** Filter products during sync operations
- **OAuth Authentication:** Secure API access using OAuth 1.0a

---

## Installation and Configuration

### Step 1: Create Magento Integration

1. Open your **Magento Admin Panel**
2. Navigate to **System > Extensions > Integrations**
3. Click **Add New Integration**
4. Enter a valid name (e.g., `Botpress Integration`)
5. Go to the **API** tab and check:
   - `Catalog` and all items underneath it
   - `Inventory` (for stock operations)
   - `User Content` > `All Reviews`
   - `Reports` > `Reviews` (By Customers, By Products)
   - `Attributes` > `Product`, `Attribute Set`, `Ratings`, `Swatches`
   
   > **Note:** These additional API scopes are required for full product, review, and attribute support in the integration.
   > 
   > **To enable review functionality, you must also install the Reviews API module:**
   > 
   > ```sh
   > composer require divante/magento2-review-api
   >
   > bin/magento setup:upgrade
   > ```
   >
   > This ensures the necessary endpoints for product reviews are available in your Magento instance.
6. Return to the **Integration Info** tab, enter your admin password, and click **Save**
7. In the integrations list, click **Activate** next to your new integration
8. Copy the following credentials:
   - **Consumer Key**
   - **Consumer Secret**
   - **Access Token**
   - **Access Token Secret**

### Step 2: Configure Botpress Integration

1. In Botpress, navigate to your bot's **Integrations** section
2. Find and enable the **Magento 2** integration
3. Enter the following configuration:
   - **Magento Domain URL** (e.g., `www.yourstore.com`)
   - **Consumer Key**
   - **Consumer Secret**
   - **Access Token**
   - **Access Token Secret**
   - **Botpress Personal Access Token (PAT)** for Tables API access
4. Click **Save Configuration**

---

## Available Actions

### **Get Products**

Retrieve products from your Magento catalog using flexible search criteria.

> **Note:** To filter products, provide the filter JSON directly (as an array or object) in the input field—do not wrap it in a string, do not use escaped characters. All filter JSON examples in this guide apply to both the **Get Products** and **Sync Products to Botpress Table** actions.

#### **Input Example**

**Filter by Price:**
```json
[
  { "field": "price", "condition": "gt", "value": "100" }
]
```

**Filter by SKU:**
```json
[
  { "field": "sku", "condition": "eq", "value": "24-MB01" }
]
```

#### **Output**
```json
{
  "result": {
    "items": [
      {
        "id": 1,
        "sku": "24-MB01",
        "name": "Joust Duffle Bag",
        "price": 34.00,
        "type_id": "simple",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00"
      }
    ],
    "search_criteria": {},
    "total_count": 1
  }
}
```

### **Get Stock Item**

Get real-time stock information for a specific product by SKU.

#### **Input Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sku` | String | Yes | The SKU of the product to get stock information for |

#### **Usage Example**
```json
{
  "sku": "24-MB01"
}
```

#### **Output**
```json
{
  "qty": 50,
  "is_in_stock": true
}
```

### **Sync Products to Botpress Table**

Automatically sync products from Magento to a Botpress table with intelligent schema creation.

#### **Input Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `table_name` | String | Yes | Name of the Botpress table to sync products to |
| `custom_attributes` | String | No | Comma-separated list of custom product attributes |
| `filters_json` | String | No | JSON array of filter objects for selective syncing |

#### **Default Table Schema**
The integration automatically creates a table with the following columns:

| Column Name | Type | Description |
|-------------|------|-------------|
| `sku` | text | Product SKU (required, unique) |
| `name` | text | Product name |
| `description` | text | Product description |
| `price` | number | Product price |
| `original_price` | number | Original price (if available) |
| `currency` | text | Currency code (e.g., USD) |
| `image_url` | text | Main product image URL |
| `thumbnail_url` | text | Thumbnail image URL |
| `stock_qty` | number | Quantity in stock |
| `is_in_stock` | boolean | Whether the product is in stock |
| `average_rating` | number | Average review rating |
| `review_count` | number | Number of reviews |

#### **Usage Examples**

**Basic Sync:**
- **Table Name:** magento_products

**With Custom Attributes:**
- **Table Name:** magento_products
- **Custom Attributes:** color,brand,size,material

**With Filtering:**
- **Table Name:** magento_products
- **Custom Attributes:** color,tent_type
- **Filters JSON:** [{"field": "price", "condition": "gt", "value": "50"}]

#### **Output**
```json
{
  "success": true,
  "synced_count": 150,
  "total_count": 200,
  "table_name": "magento_products"
}
```

---

## Advanced Filtering

### Filter Conditions

When using `filters_json` in the sync action, you can use the following conditions based on the [Adobe Commerce REST API documentation](https://developer.adobe.com/commerce/webapi/rest/use-rest/performing-searches/#logical-and-and-or-search):

| Condition | Description | Example |
|-----------|-------------|---------|
| `eq` | Equals | `{"field": "sku", "condition": "eq", "value": "24-MB01"}` |
| `neq` | Not equal | `{"field": "price", "condition": "neq", "value": "0"}` |
| `gt` | Greater than | `{"field": "price", "condition": "gt", "value": "100"}` |
| `gteq` | Greater than or equal | `{"field": "price", "condition": "gteq", "value": "50"}` |
| `lt` | Less than | `{"field": "price", "condition": "lt", "value": "200"}` |
| `lteq` | Less than or equal | `{"field": "price", "condition": "lteq", "value": "150"}` |
| `from` | Beginning of a range (must be used with `to`) | `{"field": "price", "condition": "from", "value": "50"}` |
| `to` | End of a range (must be used with `from`) | `{"field": "price", "condition": "to", "value": "200"}` |
| `like` | Like (supports SQL wildcard characters) | `{"field": "name", "condition": "like", "value": "jacket"}` |
| `nlike` | Not like | `{"field": "name", "condition": "nlike", "value": "test"}` |
| `in` | In (comma-separated list of values) | `{"field": "sku", "condition": "in", "value": "SKU1,SKU2,SKU3"}` |
| `nin` | Not in (comma-separated list of values) | `{"field": "sku", "condition": "nin", "value": "SKU1,SKU2"}` |
| `finset` | A value within a set of values | `{"field": "category_id", "condition": "finset", "value": "5"}` |
| `nfinset` | A value that is not within a set of values | `{"field": "category_id", "condition": "nfinset", "value": "5"}` |
| `moreq` | More or equal | `{"field": "price", "condition": "moreq", "value": "100"}` |
| `null` | Is null | `{"field": "description", "condition": "null"}` |
| `notnull` | Not null | `{"field": "color", "condition": "notnull"}` |

### Filter Examples

#### Filter by Price Range

**Table Name:**
magentoProducts

**Custom Attributes:**
(leave blank or enter your custom attributes)

**Filters JSON:**
[
  { "field": "price", "condition": "gteq", "value": "50" },
  { "field": "price", "condition": "lteq", "value": "200" }
]

---

#### Filter by Custom Attributes

**Table Name:**
magentoProducts

**Custom Attributes:**
color,brand

**Filters JSON:**
[
  { "field": "color", "condition": "notnull" },
  { "field": "brand", "condition": "eq", "value": "Nike" }
]

---

#### Filter by SKU Pattern

**Table Name:**
magentoProducts

**Custom Attributes:**
(leave blank or enter your custom attributes)

**Filters JSON:**
[
  { "field": "sku", "condition": "neq", "value": "" }
]

---

### Logical AND and OR Operations

**Logical AND (multiple filter groups):**
```json
[
  {"field": "price", "condition": "gteq", "value": "50"},
  {"field": "price", "condition": "lteq", "value": "200"},
  {"field": "status", "condition": "eq", "value": "1"}
]
```

**Logical OR (multiple filters in same group):**
```json
[
  {"field": "sku", "condition": "like", "value": "WSH%"},
  {"field": "sku", "condition": "like", "value": "WP%"}
]
```

**Complex AND/OR combination:**
```json
[
  {"field": "sku", "condition": "like", "value": "WSH%"},
  {"field": "sku", "condition": "like", "value": "WP%"},
  {"field": "price", "condition": "from", "value": "40"},
  {"field": "price", "condition": "to", "value": "49.99"}
]
```

> **Note:** OR operations can only be performed within the same filter group. You cannot perform OR across different filter groups like `(A AND B) OR (X AND Y)`.

---

## 📋 Search Criteria Reference

For advanced product filtering, refer to the [Adobe Commerce API Documentation](https://developer.adobe.com/commerce/webapi/rest/use-rest/performing-searches/).

---

## Best Practices

### Performance Optimization
- Use specific search criteria to reduce response times

### Data Management
- Use custom attributes to include relevant product information

### Security
- Keep your OAuth credentials secure

---

## 🔗 Additional Resources

- [Adobe Commerce API Documentation](https://developer.adobe.com/commerce/webapi/rest/)
- [Botpress Tables API](https://botpress.com/docs/learn/reference/tables)

