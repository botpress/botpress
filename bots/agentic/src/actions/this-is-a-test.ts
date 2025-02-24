export const input = z.object({
  name: z.string(),
})

export const output = z.object({
  greing: z.string(),
})

export const action: Actions.ThisIsATest = async ({ name }) => {
  return {
    greing: `Hello ${name}`,
  }
}
