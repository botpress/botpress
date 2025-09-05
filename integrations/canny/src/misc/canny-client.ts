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
  userId: string
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
  parentId?: string
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
  parentId?: string
  post: Post
  private: boolean
  reactions: Record<string, number>
  value: string
}

export type CreatePostRequest = {
  authorId: string
  boardId: string
  byId?: string
  categoryId?: string
  details: string
  title: string
  ownerId?: string
  imageURLs?: string[]
  createdAt?: string
  eta?: string
  etaPublic?: boolean
  customFields?: Record<string, any>
}

export type UpdatePostRequest = {
  postId: string
  title?: string
  details?: string
  eta?: string
  etaPublic?: boolean
  imageURLs?: string[]
  customFields?: Record<string, any>
}

export type CreateCommentRequest = {
  authorId: string
  postId: string
  value: string
  parentId?: string
  imageURLs?: string[]
  internal?: boolean
  shouldNotifyVoters?: boolean
  createdAt?: string
}

export type ListPostsRequest = {
  boardId?: string
  authorId?: string
  companyId?: string
  tagIds?: string[]
  limit?: number
  skip?: number
  search?: string
  sort?: 'newest' | 'oldest' | 'relevance' | 'score' | 'statusChanged' | 'trending'
  status?: string
}

export type ListCommentsRequest = {
  postId?: string
  authorId?: string
  boardId?: string
  companyId?: string
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
  userId?: string
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
  private constructor(
    private readonly _client: Axios,
    private readonly _apiKey: string
  ) {}

  public static create(config: CannyClientConfiguration) {
    const client = axios.create({
      baseURL: 'https://canny.io/api/v1',
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformRequest: [
        (data) => {
          return JSON.stringify({ ...data, apiKey: config.apiKey })
        },
      ],
    })

    return new CannyClient(client, config.apiKey)
  }

  public async createPost(request: CreatePostRequest): Promise<{ id: string }> {
    const response = await this._client.post('/posts/create', request)
    return response.data
  }

  public async getPost(id: string, boardId?: string): Promise<Post> {
    const response = await this._client.post('/posts/retrieve', { id, boardId })
    return response.data
  }

  public async listPosts(request: ListPostsRequest = {}): Promise<ListPostsResponse> {
    const response = await this._client.post('/posts/list', request)
    return response.data
  }

  public async updatePost(request: UpdatePostRequest): Promise<{ success: boolean }> {
    const response = await this._client.post('/posts/update', request)
    return { success: response.data === 'success' }
  }

  public async deletePost(postId: string): Promise<{ success: boolean }> {
    const response = await this._client.post('/posts/delete', { postId })
    return { success: response.data === 'success' }
  }

  public async createComment(request: CreateCommentRequest): Promise<{ id: string }> {
    const response = await this._client.post('/comments/create', request)
    return response.data
  }

  public async getComment(id: string): Promise<Comment> {
    const response = await this._client.post('/comments/retrieve', { id })
    return response.data
  }

  public async listComments(request: ListCommentsRequest = {}): Promise<ListCommentsResponse> {
    const response = await this._client.post('/comments/list', request)
    return response.data
  }

  public async deleteComment(commentId: string): Promise<{ success: boolean }> {
    const response = await this._client.post('/comments/delete', { commentId })
    return { success: response.data === 'success' }
  }

  public async createOrUpdateUser(request: CreateUserRequest): Promise<User> {
    const response = await this._client.post('/users/create_or_update', request)
    return response.data
  }

  public async listUsers(request: ListUsersRequest = {}): Promise<ListUsersResponse> {
    const response = await this._client.post('https://canny.io/api/v2/users/list', request)
    return response.data
  }

  public async listBoards(request: ListBoardsRequest = {}): Promise<ListBoardsResponse> {
    const response = await this._client.post('/boards/list', request)
    return response.data
  }
}
