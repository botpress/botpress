import { addCartLines } from './add-cart-lines'
import { applyCartDiscount } from './apply-cart-discount'
import { createCart } from './create-cart'
import { getCart } from './get-cart'
import { getCollection } from './get-collection'
import { getProduct } from './get-product'
import { listCollections } from './list-collections'
import { searchProducts } from './search-products'
import * as bp from '.botpress'

export default {
  searchProducts,
  getProduct,
  listCollections,
  getCollection,
  createCart,
  getCart,
  addCartLines,
  applyCartDiscount,
} satisfies bp.IntegrationProps['actions']
