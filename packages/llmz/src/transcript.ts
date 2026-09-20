export namespace Transcript {
  /**
   * A file attached to a transcript message.
   *
   * - `image`: a picture the model can see.
   * - `audio`: a voice message — spoken audio of what the user said. Messages
   *   carrying an audio attachment are presented as spoken turns, with audio sent as model
   *   input: audio-capable models hear it directly, others receive a
   *   transcription (see `@botpress/cognitive`'s `transcriptionModel` option).
   *
   * `url` supports http(s) URLs and base64 `data:` URIs.
   *
   * `id` is an optional stable identifier for referencing the attachment from
   * the message content (e.g. `screenshot-A` in a screen-share event log). It
   * is preserved next to the attachment in the native message.
   *
   * `alt` is an optional human-readable description shown to the model next to
   * the attachment (e.g. "Screenshot of the checkout error page").
   */
  export type Attachment = {
    type: 'image' | 'audio'
    url: string
    id?: string
    alt?: string
  }

  /**
   * How the user delivered a message. Defaults to `'text'`.
   *
   * Set to `'voice'` when the user spoke the message out loud. Use it when the
   * speech was already transcribed upstream and no audio is attached — the
   * message `content` is then treated as a transcript of what the user said.
   * Messages with an `audio` attachment are always treated as voice; setting
   * this field is not required for them.
   */
  export type Modality = 'text' | 'voice'

  export type AssistantMessage = {
    role: 'assistant'
    name?: string
    createdAt?: string
    content: string
  }

  export type UserMessage = {
    role: 'user'
    createdAt?: string
    name?: string
    content: string
    /** How the user delivered this message. Defaults to 'text'. See {@link Modality}. */
    modality?: Modality
    attachments?: Array<Attachment>
  }

  export type EventMessage = {
    role: 'event'
    createdAt?: string
    name: string
    payload: unknown
    attachments?: Array<Attachment>
  }

  export type SummaryMessage = {
    role: 'summary'
    content: string
    attachments?: Array<Attachment>
  }

  export type Message = AssistantMessage | UserMessage | EventMessage | SummaryMessage
}

/** Whether the message is a spoken turn: explicit voice modality or an audio attachment. */
export function isVoiceMessage(message: Transcript.Message): boolean {
  if (message.role === 'user' && message.modality === 'voice') {
    return true
  }

  if (message.role === 'user' || message.role === 'event') {
    return message.attachments?.some((attachment) => attachment.type === 'audio') ?? false
  }

  return false
}

/** Validate the convenience input shape before converting it to a native message. */
export function validateTranscriptMessage(message: Transcript.Message): void {
  if (!['user', 'assistant', 'event', 'summary'].includes(message.role)) {
    throw new Error(`Invalid role "${message.role}" in transcript message`)
  }

  if ('name' in message && message.name !== undefined && typeof message.name !== 'string') {
    throw new Error(`Invalid name for transcript message. Expected a string, but got type "${typeof message.name}"`)
  }

  if ('content' in message && typeof message.content !== 'string') {
    throw new Error(
      `Invalid content for transcript message. Expected a string, but got type "${typeof message.content}"`
    )
  }

  if ('modality' in message && message.modality !== undefined && !['text', 'voice'].includes(message.modality)) {
    throw new Error(`Invalid modality "${message.modality}" in transcript message. Expected "text" or "voice"`)
  }
}
