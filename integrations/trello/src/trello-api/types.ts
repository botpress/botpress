import type { Card } from 'definitions/schemas'
import { Merge } from 'src/types'

type CardPayloadOverrides = {
  verticalPosition?: number | 'top' | 'bottom'
}

export type CreateCardPayload = Merge<
  Pick<Card, 'name' | 'description' | 'listId'> & Omit<Partial<Card>, 'id' | 'isClosed'>,
  CardPayloadOverrides
>
export type UpdateCardPayload = Merge<Pick<Card, 'id'> & Partial<Card>, CardPayloadOverrides>
