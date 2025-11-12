export type Issue = {
  id: string
  identifier: string
  title: string
  estimate: number | null
  priority: number
  assignee: {
    id: string
  } | null
  state: {
    id: string
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
    name: string | null
    completedAt: string | null
  } | null
}

export const FIND_ISSUE = `
query FindIssue($filter: IssueFilter) {
  issues(filter: $filter) {
    nodes {
      id,
      identifier,
      title,
      estimate,
      priority,
      assignee {
        id
      },
      state {
        id
      },
      labels {
        nodes {
          name
          parent {
            name
          }
        }
      },
      inverseRelations {
        nodes {
          type
        }
      },
      project {
        id,
        name,
        completedAt
      }
    }
  }
}
`

export type FindIssueResult = {
  issues: {
    nodes: Issue[]
  }
}
