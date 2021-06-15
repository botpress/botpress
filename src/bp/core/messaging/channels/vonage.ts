import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingClient } from '../messaging-client'
import { MessagingService } from '../messaging-service'
import { Channel } from './base'

export class ChannelVonage extends Channel {
  get name() {
    return 'vonage'
  }

  setupProxies() {
    this.setupProxy('/webhooks/inbound', '/inbound')
    this.setupProxy('/webhooks/status', '/status')
  }
}
