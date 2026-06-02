import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'

// this type is not exported by the sdk: it's a placeholder for the integration type
type BaseIntegration = sdk.DefaultIntegration<any>

type Cast<T, U> = T extends U ? T : U

/**
 * Creates or updates a user based on the provided input.
 * If a user is found with the same discriminating tags, it will be updated.
 * If no user is found, a new user will be created.
 *
 * Usage is similar to `client.getOrCreateUser`, but with the added ability to
 * update the user if it already exists.
 */
export const createOrUpdateUser = async <
  Client extends sdk.IntegrationSpecificClient<TIntegration>,
  TIntegration extends BaseIntegration = Client extends sdk.IntegrationSpecificClient<infer TI> ? TI : never,
  CreateProps extends Parameters<Client['createUser']>[0] = Parameters<Client['createUser']>[0],
  DiscriminatingTags extends Extract<keyof CreateProps['tags'], string> = Extract<keyof CreateProps['tags'], string>,
>(
  props: CreateProps & { client: Client; discriminateByTags?: DiscriminatingTags[] }
): Promise<Awaited<ReturnType<Client['createUser']>>> => {
  const { users: matchingUsers } = await props.client.listUsers({ tags: _getFilteredTags(props) })

  const [firstUser, ...otherUsers] = matchingUsers
  if (otherUsers.length > 0) {
    throw new sdk.RuntimeError('Multiple users found with the same discriminating tags')
  }

  type UserTags = keyof TIntegration['user']['tags']

  if (firstUser) {
    const updateTags: Partial<Record<UserTags, string | null>> = { ...firstUser.tags, ...props.tags }
    return (await props.client.updateUser({
      ...firstUser,
      ...props,
      tags: updateTags as Cast<typeof updateTags, Record<string, string | null>>,
    })) as Awaited<ReturnType<Client['createUser']>>
  }

  return (await props.client.createUser(props)) as Awaited<ReturnType<Client['createUser']>>
}

const _getFilteredTags = <TAGS extends client.User['tags']>({
  tags,
  discriminateByTags,
}: {
  tags: TAGS
  discriminateByTags?: string[]
}): TAGS =>
  (discriminateByTags
    ? Object.fromEntries(Object.entries(tags).filter(([key]) => discriminateByTags!.includes(key)))
    : tags) as TAGS
