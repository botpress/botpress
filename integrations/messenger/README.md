# Messenger Integration

## OAuth Feed Events Support (Temporary)

**Version 4.1.1** now includes experimental support for OAuth configurations to subscribe to and handle Facebook feed events.

### Features Added:

- **OAuth Feed Event Subscription**: Automatically subscribes to Facebook feed events when using OAuth configuration
- **Comment Thread Handling**: Groups comments by thread (root comment ID) for better conversation management
- **Cross-Configuration Support**: Works with both manual and OAuth configurations
- **Feed Channel**: New `feed` channel for handling Facebook post comments and replies

### Usage:

1. Configure the integration using OAuth
2. The integration will automatically subscribe to feed events
3. Use the `feed` channel to send replies to Facebook post comments
4. Comments are grouped by thread for better conversation flow

### Known Limitations:

- Feed events only work with OAuth or manual configurations
- Sandbox configuration does not support feed events
- Thread resolver implementation is experimental

---

_This is temporary documentation for the OAuth feed events feature. The implementation is subject to change._
