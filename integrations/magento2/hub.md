# Magento 2 (Adobe Commerce) Integration Guide

Integrate your Magento 2 application to fetch product information seamlessly into Botpress.

---

## 🔧 Installation and Configuration

1. Open your **Magento Admin Panel**.
2. Navigate to **System > Extensions > Integrations**.
3. Click **Add New Integration**.
4. Enter a valid name (e.g., `Botpress Integration`).
5. Go to the **API** tab and check `Catalog` and all items underneath it.
6. Return to the **Integration Info** tab, enter your admin password, and click **Save**.
7. In the integrations list, click **Activate** next to your new integration.
8. Copy the following credentials:
   - **Consumer Key**
   - **Consumer Secret**
   - **Access Token**
   - **Access Token Secret**
9. Paste these credentials, along with your **Magento Domain URL**, into the Magento Integration configuration settings in **Botpress**.
10. Click **Save Configuration** in Botpress to enable the Magento integration.

---

## 🚀 Using the Integration

### 🛒 Get Products

The `Get Products` action card allows you to retrieve products from your Magento catalog and store the response in a variable for use within your Botpress workflow.

You can choose to:

- **Leave the input field empty** to fetch all products.
- Use Magento’s **`searchCriteria`** to filter results based on fields like SKU, price, or pagination parameters.

This gives you flexibility to pull in only what's relevant—whether you're:

- Building a product recommender,
- Performing lookups, or
- Listing catalog entries dynamically.

For more details on how `searchCriteria` works, refer to the **Adobe Commerce API Docs – Get Products**.

---

## 🔧 Example `searchCriteria` Usage

- **Pagination**:
  ```
  searchCriteria[pageSize]=10&searchCriteria[currentPage]=1
  ```

- **Search by SKU**:
  ```
  searchCriteria[filterGroups][0][filters][0][field]=sku&
  searchCriteria[filterGroups][0][filters][0][value]=24-MB01&
  searchCriteria[filterGroups][0][filters][0][conditionType]=eq
  ```

- **Filter products greater than a value** (e.g., price > 100):
  ```
  searchCriteria[filterGroups][0][filters][0][field]=price&
  searchCriteria[filterGroups][0][filters][0][value]=100&
  searchCriteria[filterGroups][0][filters][0][conditionType]=gt
  ```
