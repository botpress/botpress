import { ViberClient, ViberTypes } from 'messaging-api-viber'

import { ViberUser } from '../types/types'

export class Client {

  constructor(
    private client: ViberClient
  ) {
  }

  async typing(milliseconds: number): Promise<void> {
    if (milliseconds > 0) {
    }
  }

  async sendText(
    user: ViberUser,
    text: string,
    options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendText(user.id, text, options)
  }

  async getUserDetails(user: ViberUser): Promise<ViberTypes.UserDetails | null> {
    return this.client.getUserDetails(user.id)
  }

  async getOnlineStatus(user: ViberUser): Promise<ViberTypes.UserOnlineStatus | null> {
    const status = await this.client.getOnlineStatus([user.id])
    return status[0]
  }

  async sendMessage(user: ViberUser, message: ViberTypes.Message): Promise<any> {
    return this.client.sendMessage(user.id, message)
  }

  async sendPicture(user: ViberUser,
                    picture: ViberTypes.Picture,
                    options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendPicture(user.id, picture, options)
  }

  async sendVideo(user: ViberUser,
                  video: ViberTypes.Video,
                  options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendVideo(user.id, video, options)
  }

  async sendFile(user: ViberUser,
                 file: ViberTypes.File,
                 options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendFile(user.id, file, options)
  }

  async sendContact(user: ViberUser,
                    contact: ViberTypes.Contact,
                    options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendContact(user.id, contact, options)
  }

  async sendLocation(user: ViberUser,
                     location: ViberTypes.Location,
                     options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendLocation(user.id, location, options)
  }

  async sendURL(user: ViberUser,
                url: string,
                options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendURL(user.id, url, options)
  }

  async sendSticker(user: ViberUser,
                    stickerId: number,
                    options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendSticker(user.id, stickerId, options)
  }

  async sendCarouselContent(user: ViberUser,
                            richMedia: ViberTypes.RichMedia,
                            options?: ViberTypes.MessageOptions
  ): Promise<any> {
    return this.client.sendCarouselContent(
      user.id,
      richMedia,
      options
    )
  }
}
