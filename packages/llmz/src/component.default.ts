import { Component } from './component.js'

const Button: Component = {
  type: 'leaf',
  description: 'A button component that can perform actions when clicked',
  name: 'Button',
  aliases: ['btn'],
  examples: [
    {
      name: 'Say action',
      description: 'A button that triggers a say action',
      code: `<Message>
  <Button action="say" label="Hello" />
</Message>`,
    },
    {
      name: 'Postback action',
      description: 'A button that sends a postback value',
      code: `<Message>
  <Button action="postback" label="Buy" value="buy_product" />
</Message>`,
    },
  ],
  leaf: {
    props: [
      {
        name: 'action',
        type: 'string',
        default: 'say',
        description: 'The action to perform when the button is clicked. Can be "say", "url", or "postback"',
        required: true,
      },
      {
        name: 'label',
        type: 'string',
        description: 'The text displayed on the button',
        required: true,
      },
      {
        name: 'value',
        type: 'string',
        description: 'The postback value to send when the button is clicked. Required if action is "postback"',
        required: false,
      },
      {
        name: 'url',
        type: 'string',
        description: 'The URL to open when the button is clicked. Required if action is "url"',
        required: false,
      },
    ],
  },
}

const Image: Component = {
  type: 'leaf',
  name: 'Image',
  description: 'Displays an image from a URL.',
  aliases: [],
  examples: [
    {
      name: 'Basic image',
      description: 'A simple image with alt text',
      code: `<Message>
  <Image url="https://example.com/photo.jpg" alt="Example image" />
</Message>`,
    },
  ],
  leaf: {
    props: [
      {
        name: 'url',
        type: 'string',
        description: 'The URL of the image (must be valid)',
        required: true,
      },
      {
        name: 'alt',
        type: 'string',
        description: 'Alternative text describing the image',
        required: false,
      },
    ],
  },
}

const File: Component = {
  type: 'leaf',
  name: 'File',
  description: 'Sends a downloadable file to the user.',
  aliases: [],
  examples: [
    {
      name: 'PDF download',
      description: 'Send a PDF file with a name',
      code: `<Message>
  <File url="https://example.com/report.pdf" name="Report.pdf" />
</Message>`,
    },
  ],
  leaf: {
    props: [
      {
        name: 'url',
        type: 'string',
        description: 'The URL of the file (must be valid)',
        required: true,
      },
      {
        name: 'name',
        type: 'string',
        description: 'The display name of the file',
        required: false,
      },
    ],
  },
}

const Video: Component = {
  type: 'leaf',
  name: 'Video',
  description: 'Embeds a video from a URL.',
  aliases: [],
  examples: [
    {
      name: 'Intro video',
      description: 'A video with a title',
      code: `<Message>
  <Video url="https://example.com/intro.mp4" title="Welcome" />
</Message>`,
    },
  ],
  leaf: {
    props: [
      {
        name: 'url',
        type: 'string',
        description: 'The URL of the video (must be valid)',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Title for the video',
        required: false,
      },
    ],
  },
}

const Audio: Component = {
  type: 'leaf',
  name: 'Audio',
  description: 'Plays an audio clip from a URL.',
  aliases: [],
  examples: [
    {
      name: 'Sample audio',
      description: 'Play a short audio clip with a title',
      code: `<Message>
  <Audio url="https://example.com/audio.mp3" title="Sample" />
</Message>`,
    },
  ],
  leaf: {
    props: [
      {
        name: 'url',
        type: 'string',
        description: 'The URL of the audio clip (must be valid)',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Title for the audio clip',
        required: false,
      },
    ],
  },
}

const Card: Component = {
  type: 'container',
  name: 'Card',
  description: 'A visual card component that can include an image and buttons.',
  aliases: [],
  examples: [
    {
      name: 'Product card',
      description: 'A card with an image and two buttons',
      code: `<Message>
  <Card title="Product Name" subtitle="Limited offer">
    <Image url="https://example.com/product.jpg" alt="Product image" />
    <Button action="postback" label="Buy" value="buy_product" />
    <Button action="postback" label="Wishlist" value="wishlist" />
  </Card>
</Message>`,
    },
  ],
  container: {
    props: [
      {
        name: 'title',
        type: 'string',
        description: 'Title text (1–250 characters)',
        required: true,
      },
      {
        name: 'subtitle',
        type: 'string',
        description: 'Optional subtitle for the card',
        required: false,
      },
    ],
    children: [
      {
        description: 'Image (optional, max 1)',
        component: Image,
      },
      {
        description: 'Button (optional, up to 5)',
        component: Button,
      },
    ],
  },
}

const Carousel: Component = {
  type: 'container',
  name: 'Carousel',
  description: 'A virtual container for displaying 1 to 10 Card components as a carousel.',
  aliases: [],
  examples: [
    {
      name: 'Product carousel',
      description: 'A carousel with multiple cards',
      code: `<Message>
  <Carousel>
    <Card title="Item 1" subtitle="First product">
      <Image url="https://example.com/item1.jpg" alt="Item 1" />
      <Button action="postback" label="Buy" value="buy_1" />
    </Card>
    <Card title="Item 2" subtitle="Second product">
      <Image url="https://example.com/item2.jpg" alt="Item 2" />
      <Button action="postback" label="Buy" value="buy_2" />
    </Card>
  </Carousel>
</Message>`,
    },
  ],
  container: {
    props: [],
    children: [
      {
        description: 'Card component (required, 1–10 allowed)',
        component: Card,
      },
    ],
  },
}

const Text: Component = {
  type: 'default',
  name: 'Message',
  aliases: ['Text', 'Markdown'],
  description: 'Markdown-formatted text that appears directly inside components like <Message>.',
  examples: [
    {
      name: 'Basic Markdown',
      description: 'Simple markdown content inside a message',
      code: `<Message>
  **Hello**, welcome to our service!
</Message>`,
    },
  ],
  default: {
    props: [],
    children: [],
  },
}

export const DefaultComponents = {
  Button,
  Image,
  File,
  Video,
  Audio,
  Card,
  Carousel,
  Text,
}
