import * as bp from '.botpress'

export const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'X-Zendesk-Marketplace-Name': bp.secrets.MARKETPLACE_BOT_NAME,
  'X-Zendesk-Marketplace-Organization-Id': bp.secrets.MARKETPLACE_ORG_ID,
}
