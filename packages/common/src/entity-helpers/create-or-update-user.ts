import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'

// this type is not exported by the sdk: it's a placeholder for the integration type
type BaseIntegration = sdk.DefaultIntegration<any>

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
  CreateProps extends Parameters<Client['getOrCreateUser']>[0] = Parameters<Client['getOrCreateUser']>[0],
  DiscriminatingTags extends Extract<keyof CreateProps['tags'], string> = Extract<keyof CreateProps['tags'], string>,
>(
  props: CreateProps & { client: Client; discriminateByTags?: DiscriminatingTags[] }
): Promise<Awaited<ReturnType<Client['getOrCreateUser']>>> => {
  const { users: matchingUsers } = await props.client.listUsers({ tags: _getFilteredTags(props) })

  if (matchingUsers.length > 1) {
    throw new sdk.RuntimeError('Multiple users found with the same discriminating tags')
  }

  return (
    matchingUsers.length === 1
      ? await props.client.updateUser({
          ...matchingUsers[0]!,
          ...props,
          tags: { ...matchingUsers[0]!.tags, ...props.tags },
        })
      : await props.client.createUser(props)
  ) as Awaited<ReturnType<Client['getOrCreateUser']>>
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
