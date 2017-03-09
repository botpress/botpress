import { Selector } from 'testcafe'

function generateStyleSelector (field) {
    return `[class*="style__${field}___"]`
}

export class InformationPanel {
    constructor () {
        this.name        = Selector(`h3${generateStyleSelector('informationName')}`)
        this.description = Selector(`${generateStyleSelector('informationDescription')}`)
        this.author      = Selector(`${generateStyleSelector('informationAuthor')}`)
        this.version     = Selector(`${generateStyleSelector('informationVersion')}`)
        this.license     = Selector(`${generateStyleSelector('informationLicense')}`)
    }
}

class Middleware {
    constructor (mainElement) {
        this.mainElement = mainElement

        this.name = this.mainElement.find(`h4`)

        this.enabled = this.mainElement.filter(`${generateStyleSelector('enabled')}`).exists
    }
}

export class MiddlewaresPanel {
    constructor () {
        this.mainElement = Selector(`div${generateStyleSelector('middlewareList')}`)

        this.middlewares = this.mainElement.find(`div${generateStyleSelector('middleware')}`)
        this.saveBtn     = this.mainElement.find(`button${generateStyleSelector('saveButton')}`)
    }

    getMiddleware (idx) {
        return new Middleware(this.middlewares.nth(idx))
    }
}
