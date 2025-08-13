const INITIAL_UPDATE_COUNT = 3 //will update for the first INITIAL_UPDATE_COUNT messages
const UPDATE_INTERVAL = 5 //after that, will update every UPDATE_INTERVAL messages

export const isTimeToUpdate = (message_count: number): boolean => {
  if (message_count >= INITIAL_UPDATE_COUNT) return true
  return message_count % UPDATE_INTERVAL === 0
}
