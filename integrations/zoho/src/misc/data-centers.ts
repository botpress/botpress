export const DATA_CENTERS = ['us', 'eu', 'in', 'au', 'cn', 'jp', 'ca'] as const

export type DataCenter = (typeof DATA_CENTERS)[number]

export const DATA_CENTER_LABELS: Record<DataCenter, string> = {
  us: 'US - accounts.zoho.com',
  eu: 'EU - accounts.zoho.eu',
  in: 'IN - accounts.zoho.in',
  au: 'AU - accounts.zoho.com.au',
  cn: 'CN - accounts.zoho.com.cn',
  jp: 'JP - accounts.zoho.jp',
  ca: 'CA - accounts.zohocloud.ca',
}

const ZOHO_AUTH_URLS: Record<DataCenter, string> = {
  us: 'https://accounts.zoho.com',
  eu: 'https://accounts.zoho.eu',
  in: 'https://accounts.zoho.in',
  au: 'https://accounts.zoho.com.au',
  cn: 'https://accounts.zoho.com.cn',
  jp: 'https://accounts.zoho.jp',
  ca: 'https://accounts.zohocloud.ca',
}

const ZOHO_DATA_CENTER_TLDS: Record<DataCenter, string> = {
  us: 'com',
  eu: 'eu',
  in: 'in',
  au: 'com.au',
  cn: 'com.cn',
  jp: 'jp',
  ca: 'ca',
}

export const DATA_CENTER_CHOICES: { label: string; value: DataCenter }[] = DATA_CENTERS.map((dataCenter) => ({
  label: DATA_CENTER_LABELS[dataCenter],
  value: dataCenter,
}))

export const isDataCenter = (value: string | undefined): value is DataCenter =>
  DATA_CENTERS.includes(value as DataCenter)

export const getZohoAuthUrl = (dataCenter: DataCenter): string => ZOHO_AUTH_URLS[dataCenter]

export const getZohoApiBaseUrl = (dataCenter: DataCenter): string =>
  `https://www.zohoapis.${ZOHO_DATA_CENTER_TLDS[dataCenter]}`
