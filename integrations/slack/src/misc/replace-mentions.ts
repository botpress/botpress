export type Mention = {
  start: number
  end: number
  user: { id: string; name: string }
}

export const replaceMentions = (text: string | undefined, mentions: Mention[] | undefined): string | undefined => {
  if (!text || !mentions) {
    return text
  }

  mentions.sort((a, b) => b.start - a.start)
  for (const mention of mentions) {
    text = text.replace(mention.user.name, mention.user.id)
  }

  return text
}
