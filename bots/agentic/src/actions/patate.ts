export const input = z.object({})

export const output = z.object({
  test: z.string(),
})

export const action: Actions.Patate = async ({}) => {
  return {
    test: 'test',
  }
}
