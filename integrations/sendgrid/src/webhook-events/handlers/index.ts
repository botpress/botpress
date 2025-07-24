import { handleBouncedEvent } from './bounced'
import { handleClickedEvent } from './clicked'
import { handleDeferredEvent } from './deferred'
import { handleDeliveredEvent } from './delivered'
import { handleOpenedEvent } from './opened'
import { handleProcessedEvent } from './processed'

export default {
  handleProcessedEvent,
  handleDeliveredEvent,
  handleDeferredEvent,
  handleBouncedEvent,
  handleOpenedEvent,
  handleClickedEvent,
}
