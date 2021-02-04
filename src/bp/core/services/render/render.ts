import { injectable } from 'inversify'
import * as sdk from 'botpress/sdk'
import { renderRecursive } from 'core/misc/templating'

@injectable()
export class RenderService {
  renderText(text: string | sdk.MultiLangText, markdown?: boolean): sdk.render.Text {
    return {
      type: 'text',
      text,
      markdown
    }
  }

  renderImage(url: string, caption?: string | sdk.MultiLangText): sdk.render.Image {
    return {
      type: 'image',
      image: url,
      title: caption
    }
  }

  renderCard(title: string, image?: string, subtitle?: string, ...buttons: sdk.render.ActionButton[]) {
    return {
      type: 'card',
      title,
      image,
      subtitle,
      buttons
    }
  }

  renderChoice(message: string, ...choices: sdk.render.ChoiceOption[]): sdk.render.Choice {
    return {
      type: 'single-choice',
      message,
      choices
    }
  }

  renderTranslated<T extends sdk.render.Content>(content: T, lang: string): T {
    if (typeof content !== 'object' || content === null) {
      return content
    }

    for (const [key, value] of Object.entries(content)) {
      if (key == lang) {
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

  renderTemplate<T extends sdk.render.Content>(content: T, context): T {
    return renderRecursive(content, context)
  }
}
