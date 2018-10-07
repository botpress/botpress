/*
It may appear that it's not useful for Q&A to just intercept all the users' messages and try to match them against Q&A's intents. 
This can be customized by adding a flag to an incoming event.
*/

const messageTypesToDiscard = ['session_reset', 'typing', 'visit']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.AVOID_QNA_PROCESSING, true)
}
