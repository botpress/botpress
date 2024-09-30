import { RuntimeError } from '@botpress/client'
import {
  User as GitHubUser,
  Issue as GitHubIssue,
  PullRequest as GitHubPullRequest,
  Discussion as GitHubDiscussion,
  Repository as GitHubRepository,
  Label as GitHubLabel,
} from '@octokit/webhooks-types'

import { User, Issue, PullRequest, Discussion, Repository, Label } from 'src/definitions/entities'
import { Client } from '.botpress'

abstract class BaseEntityMapper<G extends object, B extends object> {
  public constructor(protected readonly client: Client) {}

  protected abstract map(_entity: G, ..._args: unknown[]): Promise<B>

  public async tryMap(entity: G, ...args: unknown[]): Promise<B> {
    try {
      return await this.map(entity, ...args)
    } catch (thrown: unknown) {
      throw new RuntimeError(`Failed to map entity: ${thrown}`)
    }
  }

  public async mapEach(entities: G[]): Promise<B[]> {
    return Promise.all(entities.map((entity) => this.tryMap(entity)))
  }
}

class UserEntityMapper extends BaseEntityMapper<GitHubUser, User> {
  protected async map(githubUser: GitHubUser): Promise<User> {
    return {
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
  public constructor(client: Client, private readonly _userEntityMapper: UserEntityMapper) {
    super(client)
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
    client: Client,
    private readonly _labelEntityMapper: LabelEntityMapper,
    private readonly _userEntityMapper: UserEntityMapper,
    private readonly _repositoryEntityMapper: RepositoryEntityMapper
  ) {
    super(client)
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
    }
  }
}

class PullRequestEntityMapper extends BaseEntityMapper<GitHubPullRequest, PullRequest> {
  public constructor(
    client: Client,
    private readonly _labelEntityMapper: LabelEntityMapper,
    private readonly _userEntityMapper: UserEntityMapper,
    private readonly _repositoryEntityMapper: RepositoryEntityMapper
  ) {
    super(client)
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
    }
  }
}

class DiscussionEntityMapper extends BaseEntityMapper<GitHubDiscussion, Discussion> {
  public constructor(
    client: Client,
    private readonly _repositoryEntityMapper: RepositoryEntityMapper,
    private readonly _labelEntityMapper: LabelEntityMapper
  ) {
    super(client)
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
    }
  }
}

export const mapping = (client: Client) => {
  const userEntityMapper = new UserEntityMapper(client)
  const repositoryEntityMapper = new RepositoryEntityMapper(client, userEntityMapper)
  const labelEntityMapper = new LabelEntityMapper(client)
  const issueEntityMapper = new IssueEntityMapper(client, labelEntityMapper, userEntityMapper, repositoryEntityMapper)
  const pullRequestEntityMapper = new PullRequestEntityMapper(
    client,
    labelEntityMapper,
    userEntityMapper,
    repositoryEntityMapper
  )
  const discussionEntityMapper = new DiscussionEntityMapper(client, repositoryEntityMapper, labelEntityMapper)

  return {
    mapUser: async (githubUser: GitHubUser) => userEntityMapper.tryMap(githubUser),
    mapRepository: async (githubRepository: GitHubRepository) => repositoryEntityMapper.tryMap(githubRepository),
    mapLabel: async (githubLabel: GitHubLabel) => labelEntityMapper.tryMap(githubLabel),
    mapIssue: async (githubIssue: GitHubIssue, repository: GitHubRepository) =>
      issueEntityMapper.tryMap(githubIssue, repository),
    mapPullRequest: async (githubPullRequest: GitHubPullRequest, repository: GitHubRepository) =>
      pullRequestEntityMapper.tryMap(githubPullRequest, repository),
    mapDiscussion: async (githubDiscussion: GitHubDiscussion, repository: GitHubRepository) =>
      discussionEntityMapper.tryMap(githubDiscussion, repository),
  }
}
