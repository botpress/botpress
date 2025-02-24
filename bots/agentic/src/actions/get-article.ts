export const input = entities.anthony

export const output = z.object({
  greeting: z.string(),
  test: z.string(),
  LOL: z.string(),
})

export const action: Actions.GetArticle = async ({ anthonyName }) => {
  return {
    greeting: `Hello ${anthonyName}`,
    test: 'test',
    LOL: 'LOL',
  }
}
