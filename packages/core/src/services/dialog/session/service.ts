import { BotpressEvent } from 'botpress-module-sdk'
import { inject, injectable } from 'inversify'

import { TYPES } from '../../../misc/types'
import { DialogContext, DialogSession, SessionRepository } from '../../../repositories/session-repository'

@injectable()
export class SessionService {
  constructor(@inject(TYPES.SessionRepository) private repository: SessionRepository) {}

  async getOrCreateSession(sessionId): Promise<DialogSession> {
    const session = await this.getSession(sessionId)
    if (!session) {
      return this.createSession(sessionId)
    }
    return session
  }

  async updateSessionContext(sessionId, context: DialogContext) {
    const session = await this.getSession(sessionId)
    session.context = context
    return this.updateSession(session)
  }

  async updateSessionEvent(sessionId, event: BotpressEvent) {
    const session = await this.getSession(sessionId)
    session.event = event
    return this.updateSession(session)
  }

  async createSession(sessionId): Promise<DialogSession> {
    const session = new DialogSession(sessionId, '')
    return this.repository.insert(session)
  }

  async deleteSession(id: string) {
    return this.repository.delete(id)
  }

  async updateSession(session: DialogSession): Promise<DialogSession> {
    await this.repository.update(session)
    return session
  }

  async getSession(id: string): Promise<DialogSession> {
    return this.repository.get(id)
  }
}
