export const input = z.object({
  name: z.string(),
})

export const output = z.object({
  greeting: z.string(),
  okPatate: z.string(),
})

export const action: Actions.ListArticles = async ({ name }) => {
  return {
    greeting: `Hello ${name}`,
    okPatate: 'okPatate',
  }
}
