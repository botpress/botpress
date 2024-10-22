import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Button,
  Row,
  Column,
  Heading,
  Markdown,
  Text,
  Section,
} from '@react-email/components'
import MailComposer from 'nodemailer/lib/mail-composer'
import type Mail from 'nodemailer/lib/mailer'
import * as react from 'react'
import { renderToString } from 'react-dom/server'
import { encodeBase64URL } from './string-utils'

export const composeRawEmail = async (options: Mail.Options) => {
  const mailComposer = new MailComposer(options)
  const message = await mailComposer.compile().build()
  return encodeBase64URL(message)
}

export const generateImageMessage = (props: Parameters<typeof _ImageMessage>[0]) => _renderMessage(_ImageMessage(props))

export const generateAudioMessage = (props: Parameters<typeof _AudioMessage>[0]) => _renderMessage(_AudioMessage(props))

export const generateVideoMessage = (props: Parameters<typeof _VideoMessage>[0]) => _renderMessage(_VideoMessage(props))

export const generateFileDownloadMessage = (props: Parameters<typeof _FileDownloadMessage>[0]) =>
  _renderMessage(_FileDownloadMessage(props))

export const generateMarkdownMessage = ({ markdown }: { markdown: string }) =>
  _renderMessage(<Markdown>{markdown}</Markdown>)

export const generateCardMessage = (props: Parameters<typeof _CardMessage>[0]) => _renderMessage(_CardMessage(props))

export const generateCarouselMessage = (props: Parameters<typeof _CarouselMessage>[0]) =>
  _renderMessage(_CarouselMessage(props))

export const generateLocationMessage = (props: Parameters<typeof _LocationMessage>[0]) =>
  _renderMessage(_LocationMessage(props))

const _renderMessage = (message: react.ReactNode) => renderToString(<_BaseMessage>{message}</_BaseMessage>)

const _BaseMessage = ({ children }: react.PropsWithChildren) => (
  <Html>
    <Head />
    <Body style={_bodyStyle}>
      <Container style={_innerContainerStyle}>{children}</Container>
    </Body>
  </Html>
)

const _bodyStyle = {
  backgroundColor: '#ffffff',
} as const

const _innerContainerStyle = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
} as const

const _primaryButtonStyle = {
  backgroundColor: 'rgb(79,70,229)',
  borderRadius: '8px',
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '12px',
  paddingBottom: '12px',
  fontWeight: '600',
  color: 'rgb(255,255,255)',
} as const

const _primaryHeadingStyle = {
  fontSize: '24px',
  lineHeight: '36px',
  fontWeight: 600,
  color: 'rgb(17,24,39)',
  textAlign: 'center',
} as const

const _ImageMessage = ({ imageUrl, altText }: { imageUrl: string; altText: string }) => (
  <>
    <Heading as="h1" style={_primaryHeadingStyle}>
      {altText}
    </Heading>
    <Link href={imageUrl}>
      <Img alt={altText} height={250} src={imageUrl} style={{ borderRadius: 12, margin: '0 auto' }} />
    </Link>
  </>
)

const _IconButton = ({ icon, text, href }: { icon: react.ReactNode; text: string; href: string }) => (
  <Button href={href} style={_primaryButtonStyle}>
    <Row>
      <Column style={{ paddingRight: '.3em' }} role="presentation">
        {icon}
      </Column>
      <Column>{text}</Column>
    </Row>
  </Button>
)

const _AudioMessage = ({ audioUrl, title: text }: { audioUrl: string; title: string }) =>
  _IconButton({ icon: <span style={{ fontSize: '1.3em', lineHeight: '100%' }}>⯈</span>, text, href: audioUrl })

const _VideoMessage = ({ videoUrl, title: text }: { videoUrl: string; title: string }) =>
  _IconButton({ icon: <span style={{ fontSize: '1.3em', lineHeight: '100%' }}>⯈</span>, text, href: videoUrl })

const _FileDownloadMessage = ({ fileUrl, title: text }: { fileUrl: string; title: string }) =>
  _IconButton({ icon: '🡳', text, href: fileUrl })

const _LocationMessage = ({
  latitude,
  longitude,
  address,
  title,
}: {
  latitude: number
  longitude: number
  address?: string
  title?: string
}) => {
  const previewUrl = `https://staticmap.maptoolkit.net/?size=350x250&zoom=16&marker=center:${latitude},${longitude}`
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${address ?? `${latitude},${longitude}`}`

  return (
    <>
      {title && (
        <Heading as="h1" style={_primaryHeadingStyle}>
          {title}
        </Heading>
      )}
      <Link href={googleMapsUrl}>
        <Img alt={address} height={250} width={350} src={previewUrl} style={{ borderRadius: 12, margin: '0 auto' }} />
      </Link>
      {address && <Text style={{ textAlign: 'center' }}>{address}</Text>}
      <Container style={{ marginTop: '1em', textAlign: 'center' }}>
        <Button href={googleMapsUrl} style={_primaryButtonStyle}>
          Open in Google Maps
        </Button>
      </Container>
    </>
  )
}

const _CardMessage = ({
  title,
  subtitle,
  imageUrl,
  actions,
}: {
  title: string
  subtitle: string
  imageUrl: string
  actions: {
    action: 'postback' | 'url' | 'say'
    label: string
    value: string
  }[]
}) => (
  <Container>
    <Img
      alt="banner image"
      height="320"
      src={imageUrl}
      style={{
        width: '100%',
        borderRadius: 12,
        objectFit: 'cover',
      }}
      role="presentation"
    />
    <Section
      style={{
        marginTop: 24,
        textAlign: 'center',
      }}
    >
      <Text
        style={{
          marginTop: 16,
          marginBottom: 16,
          fontSize: 18,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        {subtitle}
      </Text>
      <Heading
        as="h1"
        style={{
          margin: '0px',
          marginTop: 8,
          marginBottom: 16,
          fontSize: 36,
          lineHeight: '36px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        {title}
      </Heading>
      <table
        style={{
          width: 'auto',
          margin: '0 auto',
        }}
      >
        {actions.map(({ label, value }) => (
          <tr>
            <td>
              <Button
                href={value}
                style={{
                  marginTop: 16,
                  borderRadius: 8,
                  backgroundColor: 'rgb(79,70,229)',
                  paddingLeft: 40,
                  paddingRight: 40,
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontWeight: 600,
                  color: 'rgb(255,255,255)',
                  display: 'block',
                }}
              >
                {label}
              </Button>
            </td>
          </tr>
        ))}
      </table>
    </Section>
  </Container>
)

const _CarouselMessage = ({
  cards,
}: {
  cards: {
    title: string
    subtitle: string
    imageUrl: string
    actions: { action: 'postback' | 'url' | 'say'; label: string; value: string }[]
  }[]
}) => (
  <>
    {cards.map((cardProps) => (
      <div style={{ marginBottom: '6em' }}>{_CardMessage(cardProps)}</div>
    ))}
  </>
)
