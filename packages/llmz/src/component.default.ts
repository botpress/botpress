import { z } from '@bpinternal/zui'
import { Component } from './component.js'

const Button = new Component({
  type: 'leaf',
  description: 'A button component that can perform actions when clicked',
  name: 'Button',
  aliases: ['btn'],
  generation: {
    usage: 'Attach quick actions to a message, e.g. postback choices or a URL to open.',
    examples: [{ props: { action: 'postback', label: 'Buy', value: 'buy_product' } }],
  },
  leaf: {
    props: z.object({
      action: z
        .enum(['say', 'url', 'postback'])
        .default('say')
        .describe('The action to perform when the button is clicked. Can be "say", "url", or "postback"'),
      label: z.string().describe('The text displayed on the button (min 1 character, max 250 characters)'),
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
  generation: {
    examples: [{ props: { url: 'https://example.com/photo.jpg', alt: 'Example image' } }],
  },
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
  generation: {
    examples: [{ props: { url: 'https://example.com/report.pdf', name: 'Report.pdf' } }],
  },
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
  generation: {
    examples: [{ props: { url: 'https://example.com/intro.mp4', title: 'Welcome' } }],
  },
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
  generation: {
    examples: [{ props: { url: 'https://example.com/audio.mp3', title: 'Sample' } }],
  },
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
  generation: {
    examples: [{ props: { title: 'Product Name', subtitle: 'Limited offer' }, body: 'Featured product of the week.' }],
  },
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
  description: 'A Markdown-formatted text message. Long answers are written the same way: plain Markdown prose.',
  generation: {
    examples: [
      // A long-form example matters: models shown only short bodies have been
      // observed drifting into JSON-wrapping long replies ({"body": "..."})
      {
        body: `Great question! Deploying happens in three steps.

First, connect your repository from the dashboard — we support GitHub and GitLab. Once connected, every push to your main branch triggers a build automatically.

Then configure your build settings:

- **Build command** — usually \`npm run build\`
- **Output directory** — where the compiled assets end up

Finally, hit **Deploy**. The first build takes a couple of minutes; subsequent ones are incremental and much faster. Want me to walk you through connecting your repository?`,
      },
      { body: '**Hello**, welcome to our service!' },
    ],
  },
  default: {
    props: z.object({}),
    children: [],
  },
})

const Speech = new Component({
  type: 'default',
  name: 'Speech',
  aliases: ['speak', 'spoken'],
  description: 'A message spoken aloud to the user via text-to-speech.',
  body: {
    format: 'text',
    description:
      'Plain conversational prose only, written to be read aloud: no Markdown, no links or URLs, no emojis, no code, no bullet points, tables or headings. Write everything the way it should be pronounced — spell out numbers, dates, units and abbreviations (e.g. "June third at three thirty PM", not "06/03 @ 3:30pm").',
  },
  generation: {
    usage: 'Use when the reply will be played back as audio (voice conversations).',
    examples: [
      { body: 'Sure! Your order shipped this morning and should arrive on Tuesday, June third, around noon.' },
    ],
  },
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
  Speech,
}
