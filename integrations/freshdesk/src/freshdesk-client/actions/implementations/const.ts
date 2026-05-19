export const PRIORITY_TO_NUM = { low: 1, medium: 2, high: 3, urgent: 4 } as const
export const STATUS_TO_NUM = { open: 2, pending: 3, resolved: 4, closed: 5 } as const
export const NUM_TO_PRIORITY = { 1: 'low', 2: 'medium', 3: 'high', 4: 'urgent' } as const
export const NUM_TO_STATUS = { 2: 'open', 3: 'pending', 4: 'resolved', 5: 'closed' } as const
