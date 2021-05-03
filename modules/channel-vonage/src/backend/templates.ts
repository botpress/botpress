type Parameter =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'payload'
      payload: string
    }
  | {
      type: 'image'
      image: {
        link: string
      }
    }
export type Parameters = Parameter[]

interface Header {
  type: 'header'
  parameters: Parameters
}

interface Body {
  type: 'body'
  parameters: Parameters
}

type ButtonSubType = 'quick_reply' | 'url'
export type Buttons = { subType: ButtonSubType; parameters: Parameters }[]

interface Button {
  type: 'button'
  sub_type: ButtonSubType
  index: number
  parameters: Parameters
}

export type Components = (Header | Body | Button)[]

export class TemplateComponents {
  private header: Header
  private body: Body
  private buttons: Button[] = []

  constructor() {}

  public withHeader(...parameters: Parameters) {
    if (parameters) {
      this.header = {
        type: 'header',
        parameters
      }
    }

    return this
  }

  public withBody(...parameters: Parameters) {
    if (parameters) {
      this.body = {
        type: 'body',
        parameters
      }
    }

    return this
  }

  public withButtons(...buttons: Buttons) {
    if (buttons) {
      buttons.forEach((button, index) => {
        this.buttons.push({
          type: 'button',
          sub_type: button.subType,
          index,
          parameters: button.parameters
        })
      })
    }

    return this
  }

  public build(): Components {
    const components: Components = []

    if (this.header) {
      components.push(this.header)
    }

    if (this.body) {
      components.push(this.body)
    }

    if (this.buttons) {
      components.push(...this.buttons)
    }

    return components
  }
}
