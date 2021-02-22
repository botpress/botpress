import * as sdk from 'botpress/sdk'
import { renderRecursive } from 'core/misc/templating'
import { injectable } from 'inversify'

const __unrendered = <T>(payload: T): T => {
  ;(<any>payload).__unrendered = true
  return payload
}

@injectable()
export class RenderService {
  renderText(text: string | sdk.MultiLangText, markdown?: boolean): sdk.experimental.render.Text {
    return __unrendered({
      type: 'text',
      text,
      markdown
    })
  }

  renderImage(url: string, caption?: string | sdk.MultiLangText): sdk.experimental.render.Image {
    return __unrendered({
      type: 'image',
      image: url,
      title: caption
    })
  }

  renderCard(
    title: string | sdk.MultiLangText,
    image?: string,
    subtitle?: string | sdk.MultiLangText,
    ...buttons: sdk.experimental.render.ActionButton[]
  ): sdk.experimental.render.Card {
    return __unrendered({
      type: 'card',
      title,
      image,
      subtitle,
      actions: buttons
    })
  }

  renderCarousel(...cards: sdk.experimental.render.Card[]): sdk.experimental.render.Carousel {
    return __unrendered({
      type: 'carousel',
      items: cards
    })
  }

  renderChoice(
    message: string | sdk.MultiLangText,
    ...choices: sdk.experimental.render.ChoiceOption[]
  ): sdk.experimental.render.Choice {
    return __unrendered({
      type: 'single-choice',
      message,
      choices
    })
  }

  renderButtonSay(title: string, text: string | sdk.MultiLangText): sdk.experimental.render.ActionSaySomething {
    return {
      action: 'Say something',
      title,
      text
    }
  }

  renderButtonUrl(title: string, url: string): sdk.experimental.render.ActionOpenURL {
    return {
      action: 'Open URL',
      title,
      url
    }
  }

  renderButtonPostback(title: string, payload: string): sdk.experimental.render.ActionPostback {
    return {
      action: 'Postback',
      title,
      payload
    }
  }

  renderOption(value: string, message?: string): sdk.experimental.render.ChoiceOption {
    return {
      value,
      message: message ?? value
    }
  }

  renderTranslated<T extends sdk.experimental.render.Content>(content: T, lang: string): T {
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

  renderTemplate<T extends sdk.experimental.render.Content>(content: T, context): T {
    return renderRecursive(content, context)
  }

  getPipeline(lang: string, context: any): sdk.experimental.render.Pipeline {
    const wrap = <T extends Array<any>, U>(fn: (...args: T) => U) => {
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
