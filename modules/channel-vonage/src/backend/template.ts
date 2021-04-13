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

interface Header {
  type: 'header'
  parameters: Parameter[]
}

interface Body {
  type: 'body'
  parameters: Parameter[]
}

type ButtonSubType = 'quick_reply' | 'url'
export type Buttons = { subType: ButtonSubType; parameters: Parameter[] }[]

interface Button {
  type: 'button'
  sub_type: ButtonSubType
  index: number
  parameters: Parameter[]
}

export type Components = (Header | Body | Button)[]

export class TemplateComponents {
  private header: Header
  private body: Body
  private buttons: Button[] = []

  constructor() {}

  public withHeader(...parameters: Parameter[]) {
    this.header = {
      type: 'header',
      parameters
    }

    return this
  }

  public withBody(...parameters: Parameter[]) {
    this.body = {
      type: 'body',
      parameters
    }

    return this
  }

  public withButtons(...buttons: Buttons) {
    buttons.forEach((button, index) => {
      this.buttons.push({
        type: 'button',
        sub_type: button.subType,
        index,
        parameters: button.parameters
      })
    })

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
