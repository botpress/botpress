export type PageLister<R extends object> = (t: { nextToken?: string }) => Promise<R & { meta: { nextToken?: string } }>

export async function listAllPages<R extends object>(lister: PageLister<R>): Promise<R[]>
export async function listAllPages<R extends object, M>(lister: PageLister<R>, mapper?: (r: R) => M[]): Promise<M[]>
export async function listAllPages<R extends object, M>(lister: PageLister<R>, mapper?: (r: R) => M[]) {
  let nextToken: string | undefined
  const all: R[] = []

  // eslint-disable no-await-in-loop -- paging must be done sequentially
  do {
    const { meta, ...r } = await lister({ nextToken })
    all.push(r as R)
    nextToken = meta.nextToken
  } while (nextToken)
  // eslint-enable no-await-in-loop

  if (!mapper) {
    return all
  }

  const mapped: M[] = all.flatMap((r) => mapper(r))
  return mapped
}
