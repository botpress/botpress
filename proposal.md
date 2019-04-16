In Botpress, all content is represented by a Content Element.

To display these elements on various channels, we have a "schema" (called a Content Type) which transforms the various fields into the required payload for each separate channel.

Right now, they are all defined in a single file, which makes it harder to add new channels and maintain them.

This proposal would leverage Hooks to move the rendering logic from the content type to a custom hook.

### Actual process:

- Calls `renderElement` on the CMS, with arguments, the content type and the channel
- The content type renders the element for use on the specified channel (creates `n` payloads)
- Payloads are pushed individually through the event engine (outgoing event)
- Each channel has a registered outgoing middleware that catches the event and sends it to the user

### Suggested process:

- Calls `renderElement` on the CMS, with arguments and content type
- The content type renders a generic payload (creates `n` payloads)
- Payloads are pushed individually through the event engine (outgoing event)
- Each channel registers a hook `beforeOutgoingMiddleware` which converts the generic payload to the required format for the channel
- Each channel has a registered outgoing middleware that catches the event and sends it to the user

Changes are subtle, but would allow to add more advanced hooks to alter the payload before sending them to the user.

Channel Web would use the generic payload out of the box, while the other channels would be able to alter them for their specific format.

### Summary

- Edit content types to remove all rendering logic except for "render = 'channel-web'"
- Create a `beforeOutgoingMiddleware` hook for each channel
- Removing the channel logic from the `renderElement` of the `cms`
