<iframe src="https://www.youtube.com/embed/pOIrLMpZZqc"></iframe>

The Messenger integration empowers your chatbot to seamlessly interact with Facebook Messenger, one of the most popular messaging platforms. Connect your AI-powered chatbot to Messenger and engage with your audience in real-time conversations. With this integration, you can automate customer support, provide personalized recommendations, send notifications, and handle inquiries directly within Messenger. Leverage Messenger's rich features, including text, images, buttons, quick replies, and more, to create dynamic and engaging chatbot experiences. Take your customer engagement to the next level with the Messenger Integration for Botpress.

## Migrating from 3.x to 4.x

### _postback_ and _say_ messages prefix

In version 4.0 of Messenger, _postback_ and _say_ messages no longer use the prefixes `postback:` or `say:`. If your bot relied on these prefixes for logic or transitions, you can update it to depend solely on the value set for the postback.
