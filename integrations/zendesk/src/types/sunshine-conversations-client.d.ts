declare module 'sunshine-conversations-client' {
  export class ApiClient {
    authentications: {
      basicAuth: {
        username: string
        password: string
      }
    }
  }

  export class MessagesApi {
    constructor(client: ApiClient)
    postMessage(appId: string, conversationId: string, message: any): Promise<{ messages: any[] }>
  }

  export class ActivitiesApi {
    constructor(client: ApiClient)
    postActivity(appId: string, conversationId: string, activity: any): Promise<any>
  }

  export class AppsApi {
    constructor(client: ApiClient)
  }

  export class ConversationsApi {
    constructor(client: ApiClient)
    getConversation(appId: string, conversationId: string): Promise<{ conversation?: any }>
  }

  export class UsersApi {
    constructor(client: ApiClient)
    getUser(appId: string, userId: string): Promise<{ user?: any }>
  }

  export class MessagePost {
    content?: any
    author?: {
      type: string
    }
  }

  interface SunshineConversationsClientType {
    ApiClient: typeof ApiClient
    MessagesApi: typeof MessagesApi
    ActivitiesApi: typeof ActivitiesApi
    AppsApi: typeof AppsApi
    ConversationsApi: typeof ConversationsApi
    UsersApi: typeof UsersApi
    MessagePost: new () => MessagePost
  }

  const SunshineConversationsClient: SunshineConversationsClientType

  export default SunshineConversationsClient
}

