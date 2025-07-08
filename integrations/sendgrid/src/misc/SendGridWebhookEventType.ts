export const enum SendGridWebhookEventType {
  PROCESSED = 'processed',
  DELIVERED = 'delivered',
  DEFERRED = 'deferred',
  BOUNCE = 'bounce',
  OPEN = 'open',
  /** When a link inside the
   *  email body was clicked */
  CLICK = 'click',
}
