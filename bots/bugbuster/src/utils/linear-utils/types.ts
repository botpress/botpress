export type Team = {
  id: string
  key: string
  name: string
  description?: string | undefined
  icon?: string | undefined
}

export type StateType = 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' | 'duplicate'
export type State = {
  id: string
  name: string
  type: StateType
}

export type ISO8601Duration = string

export type IssueComment = {
  id: string
  body: string
  resolvedAt: string | null
  createdAt: string
  user: {
    id: string
  } | null
  parentId: string | null
}

export type Issue = {
  id: string
  identifier: string
  title: string
  estimate: number | null
  priority: number
  assignee: {
    id: string
    active: boolean
  } | null
  state: {
    id: string
    name: string
  }
  labels: {
    nodes: {
      name: string
      parent: {
        name: string
      } | null
    }[]
  }
  inverseRelations: {
    nodes: {
      type: string
    }[]
  }
  project: {
    id: string
    name: string
    completedAt: string | null
  } | null
  comments: {
    nodes: IssueComment[]
  }
}

export type TeamStates = {
  id: string
  states: {
    nodes: {
      id: string
      name: string
    }[]
  }
}

export type Pagination = {
  hasNextPage: boolean
  endCursor: string
}
