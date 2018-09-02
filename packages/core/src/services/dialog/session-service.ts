import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { DialogSession, SessionRepository } from '../../repositories/session-repository'

@injectable()
export class SessionService {
  constructor(@inject(TYPES.SessionRepository) private repository: SessionRepository) {}

  async getOrCreateSession(sessionId, event, flow, node): Promise<DialogSession> {
    const session = await this.getSession(sessionId)
    if (!session) {
      return this.createSession(sessionId, flow, node, event)
    }
    return session
  }

  async createSession(sessionId, currentFlow, currentNode, event): Promise<DialogSession> {
    const session = new DialogSession(sessionId, '', { currentFlow, currentNode }, event)
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
