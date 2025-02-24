export const input = z.object({
  name: z.string(),
})

export const output = entities.test

export const action: Actions.Test = async ({}) => {}
