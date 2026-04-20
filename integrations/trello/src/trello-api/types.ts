import type { Card } from 'definitions/schemas'
import { Merge } from 'src/types'

export type CardPosition = number | 'top' | 'bottom'

export type CreateCardPayload = Pick<Card, 'name' | 'description' | 'listId'> & Omit<Partial<Card>, 'id' | 'isClosed'>
export type UpdateCardPayload = Merge<
  Pick<Card, 'id'> & Partial<Card>,
  {
    verticalPosition?: CardPosition
  }
>
