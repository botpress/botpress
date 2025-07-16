import { z } from '@bpinternal/zui'
import { Component } from './component.js'

const Button = new Component({
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
    props: z.object({
      action: z
        .enum(['say', 'url', 'postback'])
        .default('say')
        .describe('The action to perform when the button is clicked. Can be "say", "url", or "postback"'),
      label: z.string().describe('The text displayed on the button'),
      value: z
        .string()
        .optional()
        .describe('The postback value to send when the button is clicked. Required if action is "postback"'),
      url: z.string().optional().describe('The URL to open when the button is clicked. Required if action is "url"'),
    }),
  },
})

const Image = new Component({
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
    props: z.object({
      url: z.string().describe('The URL of the image (must be valid)'),
      alt: z.string().optional().describe('Alternative text describing the image'),
    }),
  },
})

const File = new Component({
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
    props: z.object({
      url: z.string().describe('The URL of the file (must be valid)'),
      name: z.string().optional().describe('The display name of the file'),
    }),
  },
})

const Video = new Component({
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
    props: z.object({
      url: z.string().describe('The URL of the video (must be valid)'),
      title: z.string().optional().describe('Title for the video'),
    }),
  },
})

const Audio = new Component({
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
    props: z.object({
      url: z.string().describe('The URL of the audio clip (must be valid)'),
      title: z.string().optional().describe('Title for the audio clip'),
    }),
  },
})

const Card = new Component({
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
    props: z.object({
      title: z.string().min(1).max(250).describe('Title text (1–250 characters)'),
      subtitle: z.string().optional().describe('Optional subtitle for the card'),
    }),
    children: [
      {
        description: 'Image (optional, max 1)',
        component: Image.definition,
      },
      {
        description: 'Button (optional, up to 5)',
        component: Button.definition,
      },
    ],
  },
})

const Carousel = new Component({
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
    props: z.object({}),
    children: [
      {
        description: 'Card component (required, 1–10 allowed)',
        component: Card.definition,
      },
    ],
  },
})

const Text = new Component({
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
    props: z.object({}),
    children: [],
  },
})

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
