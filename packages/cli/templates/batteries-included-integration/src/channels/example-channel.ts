import { BrandedChannelPublisher } from './base-channel'

export class ExampleChannelPublisher extends BrandedChannelPublisher<'exampleChannel', 'text'> {
  public async publish(): Promise<void> {
    const newMessage = await this._apiFacade.addPost({
      title: 'New post',
      body: this._payload.text,
    })

    this._ack({ tags: { exampleTag: newMessage.data.id } })
  }

  public getErrorMessage(originalError: Error): string {
    return `Error while publishing to the example channel: ${originalError.message}`
  }
}
