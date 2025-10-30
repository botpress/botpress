export function parseNextToken(url: string): string | undefined {
  const parsedUrl = new URL(url)
  return parsedUrl.searchParams.get('since_id') ?? undefined
}
