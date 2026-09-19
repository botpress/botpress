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

const Button = new Component({
  name: 'Button',
  aliases: ['btn'],
  description: 'A button that performs an action when clicked.',
  props: buttonProps,
  generation: {
    usage:
      'Offer quick actions or choices after a message. chat.buttons takes an array of button props and sends them synchronously in array order.',
    examples: [
      { props: { action: 'say', label: 'Track my order' } },
      { props: { action: 'url', label: 'View guide', url: 'https://example.com/guide' } },
      { props: { action: 'postback', label: 'Choose Standard', value: 'plan_standard' } },
      [
        { props: { action: 'say', label: 'Track my order' } },
        { props: { action: 'say', label: 'Return an item' } },
        { props: { action: 'say', label: 'Contact support' } },
      ],
    ],
  },
})

const Image = new Component({
  name: 'Image',
  description: 'Displays an image from a URL.',
  props: imageProps,
  generation: {
    usage: 'Use a known image URL from the user or tool results; never invent an image URL.',
    examples: [{ props: { url: 'https://example.com/trail.jpg', alt: 'Forest trail beside a lake' } }],
  },
})

const File = new Component({
  name: 'File',
  description: 'Sends a downloadable file to the user.',
  props: z
    .object({
      url: z.string().describe('The URL of the file (must be valid)'),
      name: z.string().optional().describe('The display name of the file'),
    })
    .strict(),
  generation: {
    examples: [{ props: { url: 'https://example.com/report.pdf', name: 'Report.pdf' } }],
  },
})

const Video = new Component({
  name: 'Video',
  description: 'Embeds a video from a URL.',
  props: z
    .object({
      url: z.string().describe('The URL of the video (must be valid)'),
      title: z.string().optional().describe('Title for the video'),
    })
    .strict(),
  generation: {
    examples: [{ props: { url: 'https://example.com/intro.mp4', title: 'Welcome' } }],
  },
})

const Audio = new Component({
  name: 'Audio',
  description: 'Plays an audio clip from a URL.',
  props: z
    .object({
      url: z.string().describe('The URL of the audio clip (must be valid)'),
      title: z.string().optional().describe('Title for the audio clip'),
    })
    .strict(),
  generation: {
    examples: [{ props: { url: 'https://example.com/audio.mp3', title: 'Sample' } }],
  },
})

const Card = new Component({
  name: 'Card',
  description: 'A card with a title, optional subtitle, Markdown text, image, and buttons.',
  props: cardProps,
  generation: {
    usage: 'Present one item with chat.card({ title, subtitle, text, image, buttons }). All content belongs in props.',
    examples: [
      {
        props: {
          title: 'Standard plan',
          subtitle: '$20/month',
          text: 'Includes 5 projects and email support.',
          buttons: [{ action: 'postback', label: 'Choose Standard', value: 'plan_standard' }],
        },
      },
    ],
  },
})

const Carousel = new Component({
  name: 'Carousel',
  description: 'Displays a horizontally scrollable collection of cards, each with its own content and actions.',
  props: z
    .object({
      cards: z
        .array(cardProps)
        .min(1)
        .max(10)
        .describe('1–10 cards, in display order. Each card has its own title, subtitle, text, image, and buttons'),
    })
    .strict(),
  generation: {
    usage:
      'Use chat.carousel({ cards: [...] }) for several comparable items. Each card can include title, subtitle, text, image {url, alt?}, and buttons [{action, label, value?, url?}]. The method sends synchronously.',
    examples: [
      {
        props: {
          cards: [
            {
              title: 'Standard plan',
              subtitle: '$20/month',
              text: '5 projects and email support.',
              image: { url: 'https://example.com/standard.jpg', alt: 'Standard plan' },
              buttons: [{ action: 'postback', label: 'Choose Standard', value: 'plan_standard' }],
            },
            {
              title: 'Team plan',
              subtitle: '$50/month',
              text: '20 projects and priority support.',
              image: { url: 'https://example.com/team.jpg', alt: 'Team plan' },
              buttons: [{ action: 'postback', label: 'Choose Team', value: 'plan_team' }],
            },
          ],
        },
      },
    ],
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
}
