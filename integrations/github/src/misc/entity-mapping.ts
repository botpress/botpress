import * as sdk from '@botpress/sdk'
import {
  User as GitHubUser,
  Issue as GitHubIssue,
  PullRequest as GitHubPullRequest,
  Discussion as GitHubDiscussion,
  Repository as GitHubRepository,
  Label as GitHubLabel,
  PullRequestReview as GitHubPullRequestReview,
} from '@octokit/webhooks-types'

import { User, Issue, PullRequest, Discussion, Repository, Label, PullRequestReview } from 'src/definitions/entities'
import * as bp from '.botpress'

abstract class BaseEntityMapper<G extends object, B extends object> {
  protected abstract map(_entity: G, ..._args: unknown[]): Promise<B>

  public async mapEach(entities: G[]): Promise<B[]> {
    return Promise.all(entities.map((entity) => this.tryMap(entity)))
  }

  public async tryMap(entity: G, ...args: unknown[]): Promise<B> {
    try {
      return await this.map(entity, ...args)
    } catch (thrown: unknown) {
      throw new sdk.RuntimeError(`Failed to map entity: ${thrown}`)
    }
  }
}

class UserEntityMapper extends BaseEntityMapper<GitHubUser, User> {
  public constructor(protected readonly client: bp.Client) {
    super()
  }

  protected async map(githubUser: GitHubUser): Promise<User> {
    return {
      name: githubUser.name ?? githubUser.login,
      handle: githubUser.login,
      id: githubUser.id,
      nodeId: githubUser.node_id,
      url: githubUser.html_url,
      botpressUser: (await this._getOrCreateBotpressUserFromGithubUser({ githubUser })).id,
    }
  }

  private async _getOrCreateBotpressUserFromGithubUser({ githubUser }: { githubUser: GitHubUser }) {
    const { users } = await this.client.listUsers({
      tags: {
        nodeId: githubUser.node_id,
      },
    })

    if (users.length && users[0]) {
      return users[0]
    }

    const { user } = await this.client.createUser({
      name: githubUser.login,
      pictureUrl: githubUser.avatar_url,
      tags: {
        handle: githubUser.login,
        nodeId: githubUser.node_id,
        id: githubUser.id.toString(),
        profileUrl: githubUser.html_url,
      },
    })

    return user
  }
}

class RepositoryEntityMapper extends BaseEntityMapper<GitHubRepository, Repository> {
  public constructor(private readonly _userEntityMapper: UserEntityMapper) {
    super()
  }
  protected async map(githubRepository: GitHubRepository): Promise<Repository> {
    return {
      id: githubRepository.id,
      nodeId: githubRepository.node_id,
      url: githubRepository.html_url,
      name: githubRepository.name,
      owner: await this._userEntityMapper.tryMap(githubRepository.owner),
    }
  }
}

class LabelEntityMapper extends BaseEntityMapper<GitHubLabel, Label> {
  protected async map(githubLabel: GitHubLabel): Promise<Label> {
    return {
      id: githubLabel.id,
      nodeId: githubLabel.node_id,
      url: githubLabel.url.replace('api.github.com/repos', 'github.com'),
      name: githubLabel.name,
    }
  }
}

class IssueEntityMapper extends BaseEntityMapper<GitHubIssue, Issue> {
  public constructor(
    private readonly _labelEntityMapper: LabelEntityMapper,
    private readonly _userEntityMapper: UserEntityMapper,
    private readonly _repositoryEntityMapper: RepositoryEntityMapper
  ) {
    super()
  }
  protected async map(githubIssue: GitHubIssue, githubRepository: GitHubRepository): Promise<Issue> {
    return {
      id: githubIssue.id,
      nodeId: githubIssue.node_id,
      url: githubIssue.html_url,
      number: githubIssue.number,
      labels: await this._labelEntityMapper.mapEach(githubIssue.labels ?? []),
      assignees: await this._userEntityMapper.mapEach(githubIssue.assignees),
      name: githubIssue.title,
      body: githubIssue.body ?? '',
      repository: await this._repositoryEntityMapper.tryMap(githubRepository),
      author: await this._userEntityMapper.tryMap(githubIssue.user),
    }
  }
}

class PullRequestEntityMapper extends BaseEntityMapper<GitHubPullRequest, PullRequest> {
  public constructor(
    private readonly _labelEntityMapper: LabelEntityMapper,
    private readonly _userEntityMapper: UserEntityMapper,
    private readonly _repositoryEntityMapper: RepositoryEntityMapper
  ) {
    super()
  }
  protected async map(githubPullRequest: GitHubPullRequest, githubRepository: GitHubRepository): Promise<PullRequest> {
    return {
      id: githubPullRequest.id,
      nodeId: githubPullRequest.node_id,
      url: githubPullRequest.html_url,
      number: githubPullRequest.number,
      labels: await this._labelEntityMapper.mapEach(githubPullRequest.labels ?? []),
      assignees: await this._userEntityMapper.mapEach(githubPullRequest.assignees),
      name: githubPullRequest.title,
      body: githubPullRequest.body ?? '',
      repository: await this._repositoryEntityMapper.tryMap(githubRepository),
      source: {
        ref: githubPullRequest.head.ref,
        label: githubPullRequest.head.label,
        repository: await this._repositoryEntityMapper.tryMap(githubPullRequest.head.repo!),
      },
      target: {
        ref: githubPullRequest.base.ref,
        label: githubPullRequest.base.label,
        repository: await this._repositoryEntityMapper.tryMap(githubPullRequest.base.repo!),
      },
      author: await this._userEntityMapper.tryMap(githubPullRequest.user),
    }
  }
}

class DiscussionEntityMapper extends BaseEntityMapper<GitHubDiscussion, Discussion> {
  public constructor(
    private readonly _repositoryEntityMapper: RepositoryEntityMapper,
    private readonly _labelEntityMapper: LabelEntityMapper,
    private readonly _userEntityMapper: UserEntityMapper
  ) {
    super()
  }
  protected async map(githubDiscussion_: GitHubDiscussion, githubRepository: GitHubRepository): Promise<Discussion> {
    const githubDiscussion = githubDiscussion_ as GitHubDiscussion & {
      labels: GitHubLabel[] | undefined
      category: { node_id: string }
    }
    return {
      id: githubDiscussion.id,
      nodeId: githubDiscussion.node_id,
      url: githubDiscussion.html_url,
      number: githubDiscussion.number,
      name: githubDiscussion.title,
      body: githubDiscussion.body,
      labels: await this._labelEntityMapper.mapEach(githubDiscussion.labels ?? []),
      repository: await this._repositoryEntityMapper.tryMap(githubRepository),
      category: {
        id: githubDiscussion.category.id,
        nodeId: githubDiscussion.category.node_id,
        name: githubDiscussion.category.name,
        url: `${githubRepository.html_url}/discussions/categories/${githubDiscussion.category.slug}`,
      },
      author: await this._userEntityMapper.tryMap(githubDiscussion.user),
    }
  }
}

class PullRequestReviewEntityMapper extends BaseEntityMapper<GitHubPullRequestReview, PullRequestReview> {
  public constructor(
    private readonly _userEntityMapper: UserEntityMapper,
    private readonly _pullRequestEntityMapper: PullRequestEntityMapper
  ) {
    super()
  }
  protected async map(
    githubPullRequestReview: GitHubPullRequestReview,
    githubPullRequest: GitHubPullRequest
  ): Promise<PullRequestReview> {
    return {
      id: githubPullRequestReview.id,
      nodeId: githubPullRequestReview.node_id,
      url: githubPullRequestReview.html_url,
      body: githubPullRequestReview.body ?? '',
      author: await this._userEntityMapper.tryMap(githubPullRequestReview.user),
      commitId: githubPullRequestReview.commit_id,
      pullRequest: await this._pullRequestEntityMapper.tryMap(githubPullRequest),
      state: githubPullRequestReview.state.toUpperCase() as Uppercase<typeof githubPullRequestReview.state>,
    }
  }
}

export const mapping = (client: bp.Client) => {
  const mappers = _initializeMappers(client)

  const mappingFunctions = {
    mapDiscussion: mappers.discussionEntityMapper.tryMap.bind(mappers.discussionEntityMapper),
    mapIssue: mappers.issueEntityMapper.tryMap.bind(mappers.issueEntityMapper),
    mapLabel: mappers.labelEntityMapper.tryMap.bind(mappers.labelEntityMapper),
    mapPullRequest: mappers.pullRequestEntityMapper.tryMap.bind(mappers.pullRequestEntityMapper),
    mapPullRequestReview: mappers.pullRequestReviewEntityMapper.tryMap.bind(mappers.pullRequestReviewEntityMapper),
    mapRepository: mappers.repositoryEntityMapper.tryMap.bind(mappers.repositoryEntityMapper),
    mapUser: mappers.userEntityMapper.tryMap.bind(mappers.userEntityMapper),
  } as const

  return mappingFunctions
}

const _initializeMappers = (client: bp.Client) => {
  const userEntityMapper = new UserEntityMapper(client)
  const repositoryEntityMapper = new RepositoryEntityMapper(userEntityMapper)
  const labelEntityMapper = new LabelEntityMapper()
  const issueEntityMapper = new IssueEntityMapper(labelEntityMapper, userEntityMapper, repositoryEntityMapper)
  const pullRequestEntityMapper = new PullRequestEntityMapper(
    labelEntityMapper,
    userEntityMapper,
    repositoryEntityMapper
  )
  const discussionEntityMapper = new DiscussionEntityMapper(repositoryEntityMapper, labelEntityMapper, userEntityMapper)
  const pullRequestReviewEntityMapper = new PullRequestReviewEntityMapper(userEntityMapper, pullRequestEntityMapper)

  return {
    discussionEntityMapper,
    issueEntityMapper,
    labelEntityMapper,
    pullRequestEntityMapper,
    pullRequestReviewEntityMapper,
    repositoryEntityMapper,
    userEntityMapper,
  }
}
