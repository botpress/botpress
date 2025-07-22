import * as sdk from '@botpress/sdk'

export type PageToSpanProps = {
  page: number
  perPage: number
  totalElements: number
}

export type NextTokenProps = {
  page: number
  firstElementIndex: number
}

export type Span = {
  firstElementIndex: number
  lastElementIndex: number
}

export const pageToSpan = (props: PageToSpanProps): Span => {
  if (props.totalElements <= 0) {
    throw new sdk.RuntimeError('Could not read the inbox: the number of messages in the inbox is 0')
  }
  const lastElementIndex = Math.max(1, props.totalElements - props.page * props.perPage)
  const firstElementIndex = Math.max(1, lastElementIndex - props.perPage + 1)
  if (props.totalElements < firstElementIndex) {
    throw new sdk.RuntimeError('The inbox does not contain enough elements to return. The nextToken is likely invalid.')
  }

  return { firstElementIndex, lastElementIndex }
}

export const getNextToken = (props: NextTokenProps): string | undefined => {
  if (props.firstElementIndex == 1) return undefined
  return String(props.page + 1)
}
