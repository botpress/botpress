import type { Card } from 'definitions/schemas'
import { Merge } from 'src/types'

export type CardPosition = number | 'top' | 'bottom'

type CardPayloadOverrides = {
  verticalPosition?: CardPosition
}

export type CreateCardPayload = Merge<
  Pick<Card, 'name' | 'description' | 'listId'> & Omit<Partial<Card>, 'id' | 'isClosed'>,
  CardPayloadOverrides
>
export type UpdateCardPayload = Merge<Pick<Card, 'id'> & Partial<Card>, CardPayloadOverrides>
