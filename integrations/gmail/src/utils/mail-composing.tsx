import { Body, Container, Head, Html, Img, Link, Button, Row, Column, Heading, Markdown } from '@react-email/components'
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

export const generateImageMessage = ({ imageUrl, altText }: { imageUrl: string; altText: string }) =>
  _renderMessage(<_ImageMessage imageUrl={imageUrl} altText={altText} />)

export const generateAudioMessage = ({ audioUrl, title }: { audioUrl: string; title: string }) =>
  _renderMessage(<_AudioMessage audioUrl={audioUrl} title={title} />)

export const generateVideoMessage = ({ videoUrl, title }: { videoUrl: string; title: string }) =>
  _renderMessage(<_VideoMessage videoUrl={videoUrl} title={title} />)

export const generateFileDownloadMessage = ({ fileUrl, title }: { fileUrl: string; title: string }) =>
  _renderMessage(<_fileDownloadMessage fileUrl={fileUrl} title={title} />)

export const generateMarkdownMessage = ({ markdown }: { markdown: string }) =>
  _renderMessage(<Markdown>{markdown}</Markdown>)

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

const _ImageMessage = ({ imageUrl, altText }: { imageUrl: string; altText: string }) => (
  <>
    <Heading
      as="h1"
      style={{
        fontSize: '24px',
        lineHeight: '36px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
        textAlign: 'center',
      }}
    >
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
  _IconButton({ icon: '➤', text, href: audioUrl })

const _VideoMessage = ({ videoUrl, title: text }: { videoUrl: string; title: string }) =>
  _IconButton({ icon: '➤', text, href: videoUrl })

const _fileDownloadMessage = ({ fileUrl, title: text }: { fileUrl: string; title: string }) =>
  _IconButton({ icon: '🡳', text, href: fileUrl })
