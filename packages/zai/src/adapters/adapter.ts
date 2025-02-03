import { GenerationMetadata } from '../utils'

export type SaveExampleProps<TInput, TOutput> = {
  key: string
  taskType: string
  taskId: string
  instructions: string
  input: TInput
  output: TOutput
  explanation?: string
  metadata: GenerationMetadata
  status?: 'pending' | 'approved'
}

export type GetExamplesProps<TInput> = {
  taskType: string
  taskId: string
  input: TInput
}

export abstract class Adapter {
  public abstract getExamples<TInput, TOutput>(
    props: GetExamplesProps<TInput>
  ): Promise<
    Array<{
      key: string
      input: TInput
      output: TOutput
      explanation?: string
      similarity: number
    }>
  >

  public abstract saveExample<TInput, TOutput>(props: SaveExampleProps<TInput, TOutput>): Promise<void>
}
