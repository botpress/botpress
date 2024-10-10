import { BrandedActionExecutor } from './base-action'

export class ExampleActionExecutor extends BrandedActionExecutor<'exampleAction'> {
  public async execute() {
    const posts = await this._apiFacade.getPosts()

    return { outputPropName: posts.data[0].title }
  }

  public getErrorMessage(originalError: Error) {
    return `Error while executing ExampleAction: ${originalError.message}`
  }
}
