import { describe, it, expect } from 'vitest'

import { getComponentReference, renderToTsx } from './component.js'
import { DefaultComponents } from './component.default.js'

describe('getComponentReference', () => {
  it('documentation', async () => {
    const docs = Object.values(DefaultComponents)
      .map((component) => getComponentReference(component.definition))
      .join('\n\n==============\n\n')
    expect(docs).toMatchInlineSnapshot(`
      "### <Button>

      A button component that can perform actions when clicked

      **Props:**

      - \`action: "say" | "url" | "postback"\` (optional) — The action to perform when the button is clicked. Can be "say", "url", or "postback" _Default: \`say\`_
      - \`label: string\` **(required)** — The text displayed on the button
      - \`value: string\` (optional) — The postback value to send when the button is clicked. Required if action is "postback"
      - \`url: string\` (optional) — The URL to open when the button is clicked. Required if action is "url"

      **Children:**

      _None allowed._

      **Examples:**

      **Say action** — A button that triggers a say action

      \`\`\`tsx
      <Message>
        <Button action="say" label="Hello" />
      </Message>
      \`\`\`

      **Postback action** — A button that sends a postback value

      \`\`\`tsx
      <Message>
        <Button action="postback" label="Buy" value="buy_product" />
      </Message>
      \`\`\`

      ==============

      ### <Image>

      Displays an image from a URL.

      **Props:**

      - \`url: string\` **(required)** — The URL of the image (must be valid)
      - \`alt: string\` (optional) — Alternative text describing the image

      **Children:**

      _None allowed._

      **Examples:**

      **Basic image** — A simple image with alt text

      \`\`\`tsx
      <Message>
        <Image url="https://example.com/photo.jpg" alt="Example image" />
      </Message>
      \`\`\`

      ==============

      ### <File>

      Sends a downloadable file to the user.

      **Props:**

      - \`url: string\` **(required)** — The URL of the file (must be valid)
      - \`name: string\` (optional) — The display name of the file

      **Children:**

      _None allowed._

      **Examples:**

      **PDF download** — Send a PDF file with a name

      \`\`\`tsx
      <Message>
        <File url="https://example.com/report.pdf" name="Report.pdf" />
      </Message>
      \`\`\`

      ==============

      ### <Video>

      Embeds a video from a URL.

      **Props:**

      - \`url: string\` **(required)** — The URL of the video (must be valid)
      - \`title: string\` (optional) — Title for the video

      **Children:**

      _None allowed._

      **Examples:**

      **Intro video** — A video with a title

      \`\`\`tsx
      <Message>
        <Video url="https://example.com/intro.mp4" title="Welcome" />
      </Message>
      \`\`\`

      ==============

      ### <Audio>

      Plays an audio clip from a URL.

      **Props:**

      - \`url: string\` **(required)** — The URL of the audio clip (must be valid)
      - \`title: string\` (optional) — Title for the audio clip

      **Children:**

      _None allowed._

      **Examples:**

      **Sample audio** — Play a short audio clip with a title

      \`\`\`tsx
      <Message>
        <Audio url="https://example.com/audio.mp3" title="Sample" />
      </Message>
      \`\`\`

      ==============

      ### <Card>

      A visual card component that can include an image and buttons.

      **Props:**

      - \`title: string\` **(required)** — Title text (1–250 characters)
      - \`subtitle: string\` (optional) — Optional subtitle for the card

      **Children:**

      Can contain:
      - Image (optional, max 1) — \`<Image>\`
      - Button (optional, up to 5) — \`<Button>\`

      **Examples:**

      **Product card** — A card with an image and two buttons

      \`\`\`tsx
      <Message>
        <Card title="Product Name" subtitle="Limited offer">
          <Image url="https://example.com/product.jpg" alt="Product image" />
          <Button action="postback" label="Buy" value="buy_product" />
          <Button action="postback" label="Wishlist" value="wishlist" />
        </Card>
      </Message>
      \`\`\`

      ==============

      ### <Carousel>

      A virtual container for displaying 1 to 10 Card components as a carousel.

      **Props:**

      _No props._

      **Children:**

      Can contain:
      - Card component (required, 1–10 allowed) — \`<Card>\`

      **Examples:**

      **Product carousel** — A carousel with multiple cards

      \`\`\`tsx
      <Message>
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
      </Message>
      \`\`\`

      ==============

      ### <Message>

      Markdown-formatted text that appears directly inside components like <Message>.

      **Props:**

      _No props._

      **Children:**

      _None allowed._

      **Examples:**

      **Basic Markdown** — Simple markdown content inside a message

      \`\`\`tsx
      <Message>
        **Hello**, welcome to our service!
      </Message>
      \`\`\`"
    `)
  })
})

describe('renderToTsx', () => {
  it('renders a simple component with string props', () => {
    const component = {
      __jsx: true as const,
      type: 'Button',
      props: {
        label: 'Click me',
        action: 'say',
      },
      children: [],
    }
    expect(renderToTsx(component)).toBe('<Button label="Click me" action="say"></Button>')
  })

  it('renders a component with boolean props', () => {
    const component = {
      __jsx: true as const,
      type: 'Button',
      props: {
        disabled: true,
        loading: false,
      },
      children: [],
    }
    expect(renderToTsx(component)).toBe('<Button disabled></Button>')
  })

  it('renders a component with numeric props', () => {
    const component = {
      __jsx: true as const,
      type: 'Progress',
      props: {
        value: 42,
        max: 100,
      },
      children: [],
    }
    expect(renderToTsx(component)).toBe('<Progress value={42} max={100}></Progress>')
  })

  it('renders a component with object props', () => {
    const component = {
      __jsx: true as const,
      type: 'Config',
      props: {
        settings: { theme: 'dark', mode: 'compact' },
      },
      children: [],
    }
    expect(renderToTsx(component)).toBe('<Config settings={{"theme":"dark","mode":"compact"}}></Config>')
  })

  it('renders a component with nested children', () => {
    const component = {
      __jsx: true as const,
      type: 'Card',
      props: {
        title: 'Product',
      },
      children: [
        {
          __jsx: true as const,
          type: 'Button',
          props: { label: 'Buy' },
          children: [],
        },
      ],
    }
    expect(renderToTsx(component)).toBe('<Card title="Product"><Button label="Buy"></Button></Card>')
  })

  it('renders a component with text children', () => {
    const component = {
      __jsx: true as const,
      type: 'Message',
      props: {},
      children: ['Hello, world!'],
    }
    expect(renderToTsx(component)).toBe('<Message>Hello, world!</Message>')
  })

  it('renders a component with mixed children', () => {
    const component = {
      __jsx: true as const,
      type: 'Message',
      props: {},
      children: [
        'Hello, ',
        {
          __jsx: true as const,
          type: 'Button',
          props: { label: 'Click me' },
          children: [],
        },
        '!',
      ],
    }
    expect(renderToTsx(component)).toBe('<Message>Hello, <Button label="Click me"></Button>!</Message>')
  })

  it('handles null and undefined props', () => {
    const component = {
      __jsx: true as const,
      type: 'Button',
      props: {
        label: 'Click',
        optional: null,
        another: undefined,
      },
      children: [],
    }
    expect(renderToTsx(component)).toBe('<Button label="Click"></Button>')
  })

  it('renders a component with multiple children', () => {
    const component = {
      __jsx: true as const,
      type: 'Container',
      props: {},
      children: [
        {
          __jsx: true as const,
          type: 'Header',
          props: { title: 'Welcome' },
          children: [],
        },
        {
          __jsx: true as const,
          type: 'Content',
          props: { padding: true },
          children: ['Main content'],
        },
        {
          __jsx: true as const,
          type: 'Footer',
          props: { year: 2024 },
          children: [],
        },
      ],
    }
    expect(renderToTsx(component)).toBe(
      '<Container><Header title="Welcome"></Header><Content padding>Main content</Content><Footer year={2024}></Footer></Container>'
    )
  })

  it('renders a component with non-string primitive children', () => {
    const component = {
      __jsx: true as const,
      type: 'Stats',
      props: {},
      children: [
        {
          __jsx: true as const,
          type: 'Stat',
          props: { label: 'Count' },
          children: [42],
        },
        {
          __jsx: true as const,
          type: 'Stat',
          props: { label: 'Active' },
          children: [true],
        },
        {
          __jsx: true as const,
          type: 'Stat',
          props: { label: 'Empty' },
          children: [null],
        },
      ],
    }
    expect(renderToTsx(component)).toBe(
      '<Stats><Stat label="Count">42</Stat><Stat label="Active">true</Stat><Stat label="Empty">null</Stat></Stats>'
    )
  })
})
