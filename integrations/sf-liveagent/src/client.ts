import axios, { Axios } from 'axios'
import { type SFLiveagentConfig, type CreateSessionResponse, type CreatePollingResponse, type LiveAgentSession, SFLiveagentConfigSchema } from './definitions/schemas'
import { EndConversationReason } from './events/conversation-ended'
import { secrets } from '.botpress'

class ChasitorApi {
  private session?: LiveAgentSession
  private client: Axios
  constructor(private config: SFLiveagentConfig, session?: LiveAgentSession) {
    this.client = axios.create({
      baseURL: config.endpoint,
      withCredentials: true,
      proxy: config.proxy
    })
    this.session = session

    // Fill default values
    this.config = SFLiveagentConfigSchema.parse(config)

    this.client.interceptors.request.use((axionsConfig) => {
      axionsConfig.headers = {
        ...axionsConfig.headers,
        ...this.getChasitorConfig().headers
      }
      return axionsConfig
    })
  }

  public async createSession(): Promise<CreateSessionResponse> {
    try {
      const { data } = await this.client.get<CreateSessionResponse>('/rest/System/SessionId')
      this.session = { ...this.session, affinityToken: data.affinityToken, sessionId: data.id, sessionKey: data.key  }
      return data
    } catch(err) {
      if(err.response) {
        console.log('Error in the request: ' + JSON.stringify(err.response.data))
      }

      throw err
    }
  }

  public getCurrentSession() {
    return this.session
  }

  public async startChat(opts?: { userName: string }) {
    const { data } = await this.client.post('/rest/Chasitor/ChasitorInit', {
      ...this.config,
      userAgent: 'BotpressSFLA/1.0.0',
      language: 'en-US',
      screenResolution: '1900x1080',
      visitorName: opts?.userName || 'Anonymous Visitor',
      prechatDetails: [
        {
          label: 'LiveAgent ID',
          value: '',
          entityMaps: [
            {
              entityName: 'Contact',
              fieldName: 'Id',
              isFastFillable: false,
              isAutoQueryable: true,
              isExactMatchable: true
            }
          ],
          transcriptFields: [],
          displayToAgent: true
        }
      ],
      prechatEntities: [],
      receiveQueueUpdates: true,
      isPost: true
    })
    return data
  }

  getChasitorConfig() {
    return {
      headers: {
        ...(this.session?.affinityToken && { 'X-LIVEAGENT-AFFINITY': this.session?.affinityToken}),
        ...(this.session?.sessionKey && {'X-LIVEAGENT-SESSION-KEY': this.session?.sessionKey}),
        ...(this.config.apiVersion && {'X-LIVEAGENT-API-VERSION': this.config.apiVersion}),
      }
    }
  }

  public async startPolling(opts?: { webhook: { url: string } }): Promise<CreatePollingResponse | undefined> {

    if(!this.session) {
      throw new Error('Tried to start a pooling Session but doesn\'t have a Chasitor Session')
    }

    const { data } = await axios.post<CreatePollingResponse>(secrets.POOLING_URL, {
      polling: {
        debug: true,
        url: `${this.config.endpoint}/rest/System/Messages`,
        end: {
          onCode:  [ 403 ]
        },
        headers: this.getChasitorConfig().headers,
        sequence: {
          reqPlacement: {
            key: 'ack'
          },
          resPath: 'sequence'
        }
      },
      webhook: { url: opts?.webhook.url }
    }, {
      headers: {
        secret: secrets.POOLING_SK
      }
    })

    this.session.pollingKey = data.data.key
    return data
  }

  public async sendMessage(message: string) {
    if(!this.session) {
      throw new Error('Tried to send message to a session that is not initilized yet')
    }

    await this.client.post('/rest/Chasitor/ChatMessage', { text: message })
  }

  public async endSession(reason: EndConversationReason) {
    if(!this.session) {
      throw new Error('Tried to end a session that is not initilized yet')
    }

    await this.client.post('/rest/Chasitor/ChatEnd', {
      ChatEndReason: {
        reason
      }
    })
  }
}

export const getSalesforceClient = (config: SFLiveagentConfig, session?: LiveAgentSession) =>
  new ChasitorApi(config, session)
