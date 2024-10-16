import axios, { Axios } from 'axios'
import { type SFLiveagentConfig, type CreateSessionResponse, type CreatePollingResponse, type LiveAgentSession, SFLiveagentConfigSchema } from './definitions/schemas'
import { EndConversationReason } from './events/conversation-ended'
import { secrets, Logger } from '.botpress'
import { StartChatInput } from './definitions/actions'
import { RuntimeError } from '@botpress/client'

class ChasitorApi {
  private session?: LiveAgentSession
  private client: Axios
  constructor(private logger: Logger, private config: SFLiveagentConfig, session?: LiveAgentSession) {

    let proxyConfig = {}

    if(config.useProxy) {
      proxyConfig = {
        withCredentials: true,
        proxy: config.proxy
      }
    }

    this.client = axios.create({
      baseURL: config.endpoint,
      ...proxyConfig
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
    const { data } = await this.client.get<CreateSessionResponse>('/rest/System/SessionId')
    this.session = { ...this.session, affinityToken: data.affinityToken, sessionId: data.id, sessionKey: data.key  }
    return data
  }

  public getCurrentSession() {
    return this.session
  }

  public async startChat(opts: StartChatInput) {

    const prechatDetails = []
    const prechatEntities = []

    if(opts.contactId.length) {
      prechatDetails.push({ label: "ContactId", value: opts.contactId, transcriptFields: ["ContactId__c"], displayToAgent: "true" })
      prechatEntities.push(
        {
          entityName: "Contact",
          showOnCreate: "true",
          linkToEntityName: "Contact",
          linkToEntityField: "Id",
          saveToTranscript: "Contact",
          entityFieldsMaps: [
            {
              fieldName: "Id",
              label: "ContactId",
              doFind: "true",
              isExactMatch: "true",
              doCreate: "false"
            }
          ]
        }
      )
    }

    if(opts.caseId.length) {
      prechatDetails.push({ label: "CaseId", value: opts.caseId, transcriptFields: ["CaseId__c"], displayToAgent: "true" })
      prechatEntities.push(
        {
          entityName: "Case",
          showOnCreate: "true",
          linkToEntityName: "Case",
          linkToEntityField: "Id",
          saveToTranscript: "Case",
          entityFieldsMaps: [
            {
              fieldName: "Id",
              label: "CaseId",
              doFind: "true",
              isExactMatch: "true",
              doCreate: "false"
            }
          ]
        }
      )
    }

    opts?.prechatDetails.forEach((item: string) => {
      try {
        const parsedItem = JSON.parse(item)
        if(typeof parsedItem !== 'object') {
          throw new Error('array item is not an object')
        }
        prechatDetails.push(parsedItem)
      } catch (e: any) {
        this.logger.forBot().warn(`Failed to parse prechatDetail for startChat (item: ${item}): ${e.message}` )
      }
    })


    opts?.prechatEntities.forEach((item: string) => {
      try {
        const parsedItem = JSON.parse(item)
        if(typeof parsedItem !== 'object') {
          throw new Error('array item is not an object (check docs for ChasitorInit: https://developer.salesforce.com/docs/atlas.en-us.live_agent_rest.meta/live_agent_rest/live_agent_rest_request_bodies.htm)')
        }
        prechatEntities.push(parsedItem)
      } catch (e: any) {
        this.logger.forBot().warn(`Failed to parse prechatEntities for startChat (item: ${item}): ${e.message}` )
      }
    })

    if(!opts?.buttonId) {
      opts.buttonId = this.config.buttonId
    }

    if(!opts?.sessionId?.length) {
      delete opts.sessionId
    }

    this.logger.forBot().debug("Creating chat with")
    this.logger.forBot().debug({...this.config,
      screenResolution: '1900x1080',
      isPost: true,
      visitorName: opts?.userName?.length && opts?.userName || 'Anonymous Visitor',
      ...opts,
      prechatDetails,
      prechatEntities,
    })

    const { data } = await this.client.post('/rest/Chasitor/ChasitorInit', {
      ...this.config,
      screenResolution: '1900x1080',
      isPost: true,
      visitorName: opts?.userName?.length && opts?.userName || 'Anonymous Visitor',
      ...opts,
      prechatDetails,
      prechatEntities,
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
      throw new RuntimeError('Tried to start a pooling Session but doesn\'t have a Chasitor Session')
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
      throw new RuntimeError('Tried to send message to a session that is not initilized yet')
    }

    await this.client.post('/rest/Chasitor/ChatMessage', { text: message })
  }

  public async endSession(reason: EndConversationReason) {
    if(!this.session) {
      throw new RuntimeError('Tried to end a session that is not initilized yet')
    }

    await this.client.post('/rest/Chasitor/ChatEnd', {
      ChatEndReason: {
        reason
      }
    })
  }
}

export const getSalesforceClient = (logger: Logger, config: SFLiveagentConfig, session?: LiveAgentSession) =>
  new ChasitorApi(logger,config, session)
