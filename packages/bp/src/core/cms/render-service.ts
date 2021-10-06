import * as sdk from 'botpress/sdk'
import { renderRecursive } from 'core/cms/templating'
import { injectable } from 'inversify'

@injectable()
export class RenderService {
  renderText(text: string | sdk.MultiLangText, markdown?: boolean): sdk.TextContent {
    return {
      type: 'text',
      text,
      markdown
    }
  }

  renderImage(url: string, caption?: string | sdk.MultiLangText): sdk.ImageContent {
    return {
      type: 'image',
      image: url,
      title: caption
    }
  }

  renderAudio(url: string, caption?: string | sdk.MultiLangText): sdk.AudioContent {
    return {
      type: 'audio',
      audio: url,
      title: caption
    }
  }

  renderVideo(url: string, caption?: string | sdk.MultiLangText): sdk.VideoContent {
    return {
      type: 'video',
      video: url,
      title: caption
    }
  }

  renderLocation(
    latitude: number,
    longitude: number,
    address?: string | sdk.MultiLangText,
    title?: string | sdk.MultiLangText
  ): sdk.LocationContent {
    return {
      type: 'location',
      latitude,
      longitude,
      address,
      title
    }
  }

  renderCard(
    title: string | sdk.MultiLangText,
    image?: string,
    subtitle?: string | sdk.MultiLangText,
    ...buttons: sdk.ActionButton[]
  ): sdk.CardContent {
    return {
      type: 'card',
      title,
      image,
      subtitle,
      actions: buttons
    }
  }

  renderCarousel(...cards: sdk.CardContent[]): sdk.CarouselContent {
    return {
      type: 'carousel',
      items: cards
    }
  }

  renderChoice(text: string | sdk.MultiLangText, ...choices: sdk.ChoiceOption[]): sdk.ChoiceContent {
    return {
      type: 'single-choice',
      text,
      choices
    }
  }

  renderButtonSay(title: string, text: string | sdk.MultiLangText): sdk.ActionSaySomething {
    return {
      action: sdk.ButtonAction.SaySomething,
      title,
      text
    }
  }

  renderButtonUrl(title: string, url: string): sdk.ActionOpenURL {
    return {
      action: sdk.ButtonAction.OpenUrl,
      title,
      url
    }
  }

  renderButtonPostback(title: string, payload: string): sdk.ActionPostback {
    return {
      action: sdk.ButtonAction.Postback,
      title,
      payload
    }
  }

  renderOption(value: string, title?: string): sdk.ChoiceOption {
    return {
      value,
      title: title ?? value
    }
  }

  renderTranslated<T extends sdk.Content>(content: T, lang: string): T {
    if (typeof content !== 'object' || content === null) {
      return content
    }

    for (const [key, value] of Object.entries(content)) {
      if (key === lang) {
        return value
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          value[i] = this.renderTranslated(value[i], lang)
        }
      } else {
        content[key] = this.renderTranslated(value, lang)
      }
    }

    return content
  }

  renderTemplate<T extends sdk.Content>(content: T, context): T {
    return renderRecursive(content, context)
  }

  getPipeline(lang: string, context: any): sdk.RenderPipeline {
    const wrap = <T extends any[], U>(fn: (...args: T) => U) => {
      return (...args: T): U => {
        const content = fn(...args)
        const translated = this.renderTranslated(<any>content, lang)
        return this.renderTemplate(translated, context)
      }
    }

    return {
      text: wrap(this.renderText),
      image: wrap(this.renderImage),
      card: wrap(this.renderCard),
      carousel: wrap(this.renderCarousel),
      choice: wrap(this.renderChoice),
      buttonSay: wrap(this.renderButtonSay),
      buttonUrl: wrap(this.renderButtonUrl),
      buttonPostback: wrap(this.renderButtonPostback),
      option: wrap(this.renderOption)
    }
  }
}
