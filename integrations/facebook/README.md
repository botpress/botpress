# Facebook Integration

This integration enables your bot to interact with Facebook by responding to comments on Facebook posts. The bot can receive comment notifications and reply to them, allowing for automated engagement with your Facebook audience.

### Usage:

1. Configure the integration using OAuth
2. The integration will automatically subscribe to feed events
3. Use the `feed` channel to send replies to Facebook post comments
4. Comments are grouped by thread for better conversation flow

### Known Limitations:

- Feed events only work with OAuth or manual configurations
- Thread resolver implementation is experimental

---

_This is temporary documentation for the OAuth feed events feature. The implementation is subject to change._
