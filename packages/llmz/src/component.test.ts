import { describe, it, expect } from 'vitest'

import { getComponentReference } from './component.js'
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

      - \`action: string\` **(required)** — The action to perform when the button is clicked. Can be "say", "url", or "postback" _Default: \`say\`_
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
