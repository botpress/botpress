export const SHOP_NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i

export const normalizeShopDomain = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.myshopify\.com$/, '')
