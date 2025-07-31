export type TestCase<INPUT = unknown, EXPECTED = unknown> = {
  input: INPUT
  expects: EXPECTED
  description: string
  skip?: boolean
}
