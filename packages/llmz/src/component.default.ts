import { z } from '@bpinternal/zui'
import { Component, isComponent, type ContainerComponentDefinition, type RenderedComponent } from './component.js'

const Button = new Component({
  type: 'leaf',
  description: 'A button component that can perform actions when clicked',
  name: 'Button',
  aliases: ['btn'],
  generation: {
    usage:
      'Offer quick actions or choices after a message. It is common to send several buttons together: write one separate ■send=button block per choice in the SAME response. Each button has its own props and no body. Send all the choices before the final exit; do not wait for a user reply between buttons.',
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
    usage: 'Use a known image URL from the user or tool results; never invent an image URL. No body.',
    examples: [{ props: { url: 'https://example.com/trail.jpg', alt: 'Forest trail beside a lake' } }],
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
  description: 'A card with a title, optional subtitle, and Markdown body.',
  aliases: [],
  generation: {
    usage: 'Present one item. The block body is Markdown, not nested component blocks or JSX.',
    examples: [
      { props: { title: 'Standard plan', subtitle: '$20/month' }, body: 'Includes 5 projects and email support.' },
    ],
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

const carouselProps = z.object({
  cards: z
    .array(
      Card.definition.container.props.extend({
        body: z.string().optional().describe('Markdown text for this card'),
        image: Image.definition.leaf.props.optional().describe('Optional image for this card; use a known URL'),
        buttons: z.array(Button.definition.leaf.props).max(5).optional().describe('Up to 5 actions for this card'),
      })
    )
    .min(1)
    .max(10)
    .describe('1–10 cards, in display order. Each card has its own title, optional subtitle, body, image, and buttons'),
})

class CarouselComponent extends Component<ContainerComponentDefinition<typeof carouselProps>> {
  public override render(props: Component['propsType'], children: any[] = []): RenderedComponent {
    // Preserve direct rendering of legacy nested children. Protocol messages use cards props.
    if (!('cards' in props) && children.length && children.every((child) => isComponent(child, Card))) {
      return super.render(props, children)
    }

    const { cards } = carouselProps.parse(props)
    const renderedCards = cards.map(({ body, image, buttons, ...cardProps }) =>
      Card.render(cardProps, [
        ...(body ? [body] : []),
        ...(image ? [Image.render(image)] : []),
        ...(buttons ?? []).map((button) => Button.render(button)),
      ])
    )

    return super.render({}, renderedCards)
  }
}

const Carousel = new CarouselComponent({
  type: 'container',
  name: 'Carousel',
  description: 'Displays a horizontally scrollable collection of cards, each with its own content and actions.',
  aliases: [],
  body: false,
  generation: {
    usage:
      'Use for several comparable items. Put ALL cards in the cards array of ONE send block. Each card can include title, subtitle, body, image {url, alt?}, and buttons [{action, label, value?, url?}]. Do not write a Markdown list or separate Card blocks; those do not form a carousel.',
    examples: [
      {
        props: {
          cards: [
            {
              title: 'Standard plan',
              subtitle: '$20/month',
              body: '5 projects and email support.',
              image: { url: 'https://example.com/standard.jpg', alt: 'Standard plan' },
              buttons: [{ action: 'postback', label: 'Choose Standard', value: 'plan_standard' }],
            },
            {
              title: 'Team plan',
              subtitle: '$50/month',
              body: '20 projects and priority support.',
              image: { url: 'https://example.com/team.jpg', alt: 'Team plan' },
              buttons: [{ action: 'postback', label: 'Choose Team', value: 'plan_team' }],
            },
          ],
        },
      },
    ],
  },
  container: {
    props: carouselProps,
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
        body: `To reset your password:

1. Open the sign-in page and select **Forgot password?**
2. Enter the email address you use for your account.
3. Open the reset link in your email and choose a new password.

If the email does not arrive, check your spam folder. If you sign in through your organization, use its password reset process.`,
      },
      { body: 'How do you currently manage board meetings?' },
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
