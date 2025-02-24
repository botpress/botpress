export const input = z.object({
  potato: z.string(),
})

export const output = entities.anthony

export const action: Actions.GetAPotato = async ({ potato }) => {}
