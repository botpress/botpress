import axios, { Axios } from 'axios'

export type CannyClientConfiguration = {
  apiKey: string
}

export type User = {
  id: string
  created: string
  email: string
  isAdmin: boolean
  name: string
  url: string
  userID: string
}

export type Board = {
  id: string
  created: string
  name: string
  postCount: number
  url: string
}

export type Category = {
  id: string
  name: string
  postCount: number
  url: string
  parentID?: string
}

export type Tag = {
  id: string
  name: string
  postCount: number
  url: string
}

export type Post = {
  id: string
  author: User | null
  board: Board
  by?: User
  category?: Category
  commentCount: number
  created: string
  details?: string
  eta?: string
  imageURLs: string[]
  jira?: {
    linkedIssues: Array<{
      id: string
      key: string
      url: string
    }>
  }
  linear?: {
    linkedIssueIDs: string[]
  }
  owner?: User
  score: number
  status: string
  statusChangedAt?: string
  tags: Tag[]
  title: string
  url: string
}

export type Comment = {
  id: string
  author: User
  board: Board
  created: string
  imageURLs: string[]
  internal: boolean
  likeCount: number
  mentions: User[]
  parentID?: string
  post: Post
  private: boolean
  reactions: Record<string, number>
  value: string
}


export type CreatePostRequest = {
  authorID: string
  boardID: string
  byID?: string
  categoryID?: string
  details: string
  title: string
  ownerID?: string
  imageURLs?: string[]
  createdAt?: string
  eta?: string
  etaPublic?: boolean
  customFields?: Record<string, any>
}

export type UpdatePostRequest = {
  postID: string
  title?: string
  details?: string
  eta?: string
  etaPublic?: boolean
  imageURLs?: string[]
  customFields?: Record<string, any>
}

export type CreateCommentRequest = {
  authorID: string
  postID: string
  value: string
  parentID?: string
  imageURLs?: string[]
  internal?: boolean
  shouldNotifyVoters?: boolean
  createdAt?: string
}

export type ListPostsRequest = {
  boardID?: string
  authorID?: string
  companyID?: string
  tagIDs?: string[]
  limit?: number
  skip?: number
  search?: string
  sort?: 'newest' | 'oldest' | 'relevance' | 'score' | 'statusChanged' | 'trending'
  status?: string
}

export type ListCommentsRequest = {
  postID?: string
  authorID?: string
  boardID?: string
  companyID?: string
  limit?: number
  skip?: number
}

export type ListPostsResponse = {
  posts: Post[]
  hasMore: boolean
}

export type ListCommentsResponse = {
  comments: Comment[]
  hasMore: boolean
}


export type CreateUserRequest = {
  name: string
  userID?: string
  email?: string
  avatarURL?: string
  alias?: string
  created?: string
  customFields?: Record<string, any>
}

export type ListUsersRequest = {
  limit?: number 
  cursor?: string 
}

export type ListUsersResponse = {
  users: User[]
  hasNextPage: boolean
  cursor?: string
}

export type ListBoardsRequest = {
  limit?: number
  skip?: number
}

export type ListBoardsResponse = {
  boards: Board[]
  hasMore: boolean
}

export class CannyClient {
  private constructor(private readonly _client: Axios, private readonly _apiKey: string) {}

  public static create(config: CannyClientConfiguration) {
    const client = axios.create({
      baseURL: 'https://canny.io/api/v1',
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return new CannyClient(client, config.apiKey)
  }

  private async _makeRequest<T>(endpoint: string, data: any): Promise<T> {
    try {
      const requestData = { ...data, apiKey: this._apiKey }
      const response = await this._client.post(endpoint, requestData)
      return response.data
    } catch (error: any) {
      console.error(`Canny API error for ${endpoint}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  }


  public async createPost(request: CreatePostRequest): Promise<{ id: string }> {
    return this._makeRequest('/posts/create', request)
  }

  public async getPost(id: string, boardID?: string): Promise<Post> {
    return this._makeRequest('/posts/retrieve', { id, boardID })
  }

  public async listPosts(request: ListPostsRequest = {}): Promise<ListPostsResponse> {
    return this._makeRequest('/posts/list', request)
  }

  public async updatePost(request: UpdatePostRequest): Promise<{ success: boolean }> {
    const response = await this._makeRequest('/posts/update', request)
    return { success: response === 'success' }
  }

  public async deletePost(postID: string): Promise<{ success: boolean }> {
    const response = await this._makeRequest('/posts/delete', { postID })
    return { success: response === 'success' }
  }


  public async createComment(request: CreateCommentRequest): Promise<{ id: string }> {
    return this._makeRequest('/comments/create', request)
  }

  public async getComment(id: string): Promise<Comment> {
    return this._makeRequest('/comments/retrieve', { id })
  }

  public async listComments(request: ListCommentsRequest = {}): Promise<ListCommentsResponse> {
    return this._makeRequest('/comments/list', request)
  }

  public async deleteComment(commentID: string): Promise<{ success: boolean }> {
    const response = await this._makeRequest('/comments/delete', { commentID })
    return { success: response === 'success' }
  }


  public async createOrUpdateUser(request: CreateUserRequest): Promise<User> {
    return this._makeRequest('/users/create_or_update', request)
  }

  public async listUsers(request: ListUsersRequest = {}): Promise<ListUsersResponse> {
    const response = await this._makeRequestV2<ListUsersResponse>('/users/list', request)
    return response
  }

  public async listBoards(request: ListBoardsRequest = {}): Promise<ListBoardsResponse> {
    return this._makeRequest('/boards/list', request)
  }



  private async _makeRequestV2<T>(endpoint: string, data: any): Promise<T> {
    try {
      const requestData = { ...data, apiKey: this._apiKey }
      
      const v2Client = axios.create({
        baseURL: 'https://canny.io/api/v2',
        timeout: 10_000,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await v2Client.post(endpoint, requestData)
      return response.data
    } catch (error: any) {
      console.error(`Canny API v2 error for ${endpoint}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  }
}
