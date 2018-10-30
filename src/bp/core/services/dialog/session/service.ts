import { IO } from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import { DialogContext, DialogSession, SessionRepository } from 'core/repositories'
import { TYPES } from 'core/types'

@injectable()
export class SessionService {
  constructor(@inject(TYPES.SessionRepository) private repository: SessionRepository) {}

  async getOrCreateSession(sessionId: string, botId: string): Promise<DialogSession> {
    const session = await this.getSession(sessionId)
    if (!session) {
      // return this.createSession(sessionId, botId)
    }
    return session
  }

  async getStateForSession(sessionId: string): Promise<any> {
    const session = await this.getSession(sessionId)
    return session.state
  }

  async getStaleSessionsIds(botId: string, outdateTime: Date): Promise<string[]> {
    return this.repository.getStaleSessionsIds(botId, outdateTime)
  }

  async updateSessionContext(sessionId, context: DialogContext) {
    const session = await this.getSession(sessionId)
    session.context = context
    return this.updateSession(session)
  }

  async updateSessionEvent(sessionId, event: IO.Event) {
    const session = await this.getSession(sessionId)
    session.event = event
    return this.updateSession(session)
  }

  async createSession(sessionId, botId, state, context, event): Promise<DialogSession> {
    const session = new DialogSession(sessionId, botId, state, context, event)
    return this.repository.insert(session)
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.repository.delete(sessionId)
  }

  async updateSession(session: DialogSession): Promise<DialogSession> {
    await this.repository.update(session)
    return session
  }

  async updateStateForSession(sessionId: string, state: any): Promise<void> {
    const session = await this.getSession(sessionId)
    session.state = state
    await this.updateSession(session)
  }

  async getSession(id: string): Promise<DialogSession> {
    return this.repository.get(id)
  }
}
