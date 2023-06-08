export const ensureEnv = (name: string) => {
  const val = process.env[name]
  if (!val) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return val
}
