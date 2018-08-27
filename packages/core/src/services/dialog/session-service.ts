import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { DialogSession, SessionRepository } from '../../repositories/session-repository'

@injectable()
export class SessionService {
  constructor(@inject(TYPES.SessionRepository) private repository: SessionRepository) {}

  async createSession(sessionId, currentFlow, currentNode, event): Promise<DialogSession> {
    const newSession = {
      id: sessionId,
      state: '',
      context: JSON.stringify({
        currentFlow: currentFlow,
        currentNode: currentNode
      }),
      event: JSON.stringify(event)
    }
    return this.repository.insert(newSession)
  }

  async getContextForSession(id: string): Promise<any> {
    const session = await this.repository.get(id)
    return session.context
  }

  async setContextForSession(id: string, context: any) {
    const session = await this.repository.get(id)
    session.context = context
    await this.repository.update(session)
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

  async getOrCreateSession(sessionId: string, event: any) {
    // let session = await this.repository.get(sessionId)
    // if (!session) {
    //   session = {
    //     id: sessionId,
    //     event: JSON.stringify(session.event),
    //     state: JSON.stringify(session.state)
    //   }
    //   await = this.repository.insert()
    // }
  }
}
