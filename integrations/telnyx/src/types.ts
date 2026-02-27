export type Conversation = {
  id: string
  tags?: Record<string, string>
}

export type Card = {
  title: string
  subtitle?: string
  imageUrl?: string
  actions: Array<{ label: string }>
}

export type Choice = {
  text?: string
  options: Array<{ label: string; value: string }>
}

export type CreateMessageInputType = 'text' | 'image' | 'audio' | 'video' | 'file' | 'location' | 'carousel' | 'card' | 'dropdown' | 'choice' | 'bloc'

export type CreateMessageInputPayload =
  | { text: string }
  | { imageUrl: string }
  | { audioUrl: string }
  | { videoUrl: string }
  | { fileUrl: string; title?: string }
  | { latitude: number; longitude: number; title?: string; address?: string }
  | { items: Array<Card> }
  | { title: string; subtitle?: string; imageUrl?: string; actions: Array<{ label: string }> }
  | { text?: string; options: Array<{ label: string; value: string }> }
  | { items: Array<{ type: string; payload: Record<string, unknown> }> }