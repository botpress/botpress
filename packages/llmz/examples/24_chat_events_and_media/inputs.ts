import type { SessionInput } from 'llmz'

/** Adapters append external events and media just like ordinary user messages. */
export function createInputs(imageUrl: string, audioUrl?: string): SessionInput[] {
  return [
    { role: 'event', name: 'gallery.opened', payload: { galleryId: 'color-panels', source: 'button' } },
    {
      role: 'user',
      content: 'Describe the three colored panels from left to right.',
      attachments: [{ type: 'image', url: imageUrl, id: 'panels', alt: 'Three colored panels' }],
    },
    {
      role: 'user',
      modality: 'voice',
      // The host can provide an existing transcript or let Cognitive transcribe an audio attachment.
      content: audioUrl ? 'Answer the spoken question about the picture.' : 'Which color is in the middle?',
      ...(audioUrl ? { attachments: [{ type: 'audio' as const, url: audioUrl }] } : {}),
    },
  ]
}
