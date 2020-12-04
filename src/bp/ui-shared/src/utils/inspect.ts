export const inspect = (data: any) => {
  const inspectHandler = window['inspect']

  if (inspectHandler) {
    try {
      inspectHandler(data)
    } catch (err) {
      console.error(`Inspect error ${err}`)
    }
  }
}
