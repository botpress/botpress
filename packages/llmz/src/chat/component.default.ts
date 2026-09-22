import { z } from '@bpinternal/zui'
import { Component } from './component.js'

const buttonProps = z
  .object({
    action: z
      .enum(['say', 'url', 'postback'])
      .default('say')
      .describe('The action to perform when the button is clicked: say, url, or postback'),
    label: z.string().min(1).max(250).describe('The text displayed on the button (1–250 characters)'),
    value: z.string().optional().describe('The postback value. Required when action is postback'),
    url: z.string().optional().describe('The URL to open. Required when action is url'),
  })
  .strict()

const imageProps = z
  .object({
    url: z.string().describe('The URL of the image (must be valid)'),
    alt: z.string().optional().describe('Alternative text describing the image'),
  })
  .strict()

const cardProps = z
  .object({
    title: z.string().min(1).max(250).describe('Title text (1–250 characters)'),
    subtitle: z.string().optional().describe('Optional subtitle for the card'),
    text: z.string().optional().describe('Optional Markdown text for the card'),
    image: imageProps.optional().describe('Optional image for the card; use a known URL'),
    buttons: z.array(buttonProps).max(5).optional().describe('Up to 5 actions for the card'),
  })
  .strict()

const Buttons = new Component({
  name: 'buttons',
  description: 'Offer quick actions or choices after a message. Buttons appear together in array order.',
  props: z.array(buttonProps).min(1),
})

const Image = new Component({
  name: 'image',
  description: 'Display an image using a known URL from the user or tool results; never invent an image URL.',
  props: imageProps,
})

const File = new Component({
  name: 'file',
  description: 'Send a downloadable file to the user.',
  props: z
    .object({
      url: z.string().describe('The URL of the file (must be valid)'),
      name: z.string().optional().describe('The display name of the file'),
    })
    .strict(),
})

const Video = new Component({
  name: 'video',
  description: 'Embed a video from a URL.',
  props: z
    .object({
      url: z.string().describe('The URL of the video (must be valid)'),
      title: z.string().optional().describe('Title for the video'),
    })
    .strict(),
})

const Audio = new Component({
  name: 'audio',
  description: 'Play an audio clip from a URL.',
  props: z
    .object({
      url: z.string().describe('The URL of the audio clip (must be valid)'),
      title: z.string().optional().describe('Title for the audio clip'),
    })
    .strict(),
})

const Card = new Component({
  name: 'card',
  description: 'Present one item with a title, optional subtitle, Markdown text, image, and buttons.',
  props: cardProps,
})

const Carousel = new Component({
  name: 'carousel',
  description: 'Display several comparable items as a horizontally scrollable collection of cards.',
  props: z
    .object({
      cards: z
        .array(cardProps)
        .min(1)
        .max(10)
        .describe('1–10 cards in display order, each with its own content and actions'),
    })
    .strict(),
})

export const DefaultComponents = {
  Buttons,
  Image,
  File,
  Video,
  Audio,
  Card,
  Carousel,
}
