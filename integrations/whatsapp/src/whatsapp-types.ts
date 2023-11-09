export type WhatsAppPayload = {
  object: string
  entry: WhatsAppEntry[]
}

export type WhatsAppEntry = {
  id: string
  changes: WhatsAppChanges[]
}

export type WhatsAppChanges = {
  value: WhatsAppValue
  field: string
}

export type WhatsAppValue = {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts: WhatsAppProfile[]
  messages: WhatsAppMessage[]
}

export type WhatsAppProfile = {
  profile: {
    name: string
  }
  wa_id: string
}

export type WhatsAppMessage = {
  from: string
  id: string
  timestamp: string
  text?: {
    body: string
  }
  image?: {
    mime_type: string
    body: string
    sha256: string
    id: string
  }
  button?: {
    payload: string
    text: string
  }
  location?: {
    address: string
    latitude: string
    longitude: string
    name: string
    url: string
  }
  document?: {
    filename: string
    mime_type: string
    sha256: string
    id: string
  }
  audio?: {
    //could be audio file, or voice note
    mime_type: string
    sha256: string
    id: string
    voice: boolean
  }
  errors?: {
    code: number
    title: string
  }
  interactive?: {
    type: string
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
      description: string
    }
  }
  //contacts?: not implemented - long and didn't find a use case for it
  type: string
}
