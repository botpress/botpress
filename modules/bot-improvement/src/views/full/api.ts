import { AxiosInstance } from 'axios'

import { FeedbackItem, Goal, MessageGroup, QnAItem } from '../../backend/typings'

export interface BotImprovementApi {
  getFeedbackItems: () => Promise<FeedbackItem[]>
  getQnaItems: () => Promise<QnAItem[]>
  getGoals: () => Promise<Goal[]>
  fetchSession: (sessionId: string) => Promise<MessageGroup[]>
  updateFeedbackItem: (
    feedbackItem: Pick<FeedbackItem, 'eventId' | 'correctedActionType' | 'correctedObjectId' | 'status'>
  ) => Promise<void>
}

export const makeApi = (bp: { axios: AxiosInstance }): BotImprovementApi => ({
  getFeedbackItems: () => bp.axios.get('/mod/bot-improvement/feedback-items').then(res => res.data),
  getQnaItems: () => bp.axios.get('/qna/questions').then(res => res.data.items),
  getGoals: () => bp.axios.get('/mod/bot-improvement/goals').then(res => res.data),
  fetchSession: sessionId => bp.axios.get(`/mod/bot-improvement/sessions/${sessionId}`).then(res => res.data),
  updateFeedbackItem: feedbackItem =>
    bp.axios.post(`/mod/bot-improvement/feedback-items/${feedbackItem.eventId}`, feedbackItem)
})
