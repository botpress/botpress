import { z } from 'zod';

export const ProductAttributeSchema = z.object({
  attribute_code: z.string(),
  attribute_id: z.number(),
  frontend_input: z.string(),
  frontend_label: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});
export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;

export const StockItemSchema = z.object({
  qty: z.number(),
  is_in_stock: z.boolean(),
});
export type StockItem = z.infer<typeof StockItemSchema>;

export const ProductSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  price: z.number().default(0),
  original_price: z.number().optional(),
  description: z.string().optional(),
  media_gallery_entries: z.array(z.object({
    media_type: z.string(),
    file: z.string(),
  })).optional(),
  custom_attributes: z.array(z.object({
    attribute_code: z.string(),
    value: z.union([
      z.string(),
      z.array(z.any()),
      z.number(),
      z.boolean(),
      z.object({}).passthrough()
    ]),
  })).optional(),
  extension_attributes: z.object({
    stock_item: StockItemSchema.optional(),
  }).optional(),
});
export type ProductData = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  total_count: z.number(),
});
export type ProductList = z.infer<typeof ProductListSchema>;

export const ReviewSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  title: z.string(),
  detail: z.string(),
  created_at: z.string(),
  ratings: z.array(z.object({
    vote_id: z.number(),
    rating_id: z.number(),
    rating_name: z.string(),
    percent: z.number(),
    value: z.number(),
  })).optional(),
});
export const ReviewsArraySchema = z.array(ReviewSchema);
export type ReviewData = z.infer<typeof ReviewSchema>; 