import React from 'react'
import Chat from './main.jsx'

export const Fullscreen = props => <Chat {...props} fullscreen={true} />
export const Embedded = props => <Chat {...props} fullscreen={false} />

/**
 * @deprecated Since the way views are handled has changed, we're also exporting views in lowercase.
 * https://botpress.io/docs/developers/migrate/
 */
export { Embedded as embedded } from '.'
export { Fullscreen as fullscreen } from '.'

export { Carousel, QuickReplies, LoginPrompt, Text, Form, FileMessage } from './components/messages/renderer'
