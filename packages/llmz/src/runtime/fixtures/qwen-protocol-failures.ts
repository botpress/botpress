// Verbatim failures from uncached synthetic Qwen trials on 2026-09-17.
// No customer transcript, private prompt, or provider credentials are included.
export const qwenProtocolFailures = [
  {
    name: 'unmarked-estimation-answer',
    output:
      'To estimate monthly conversations, look at your recent conversation totals rather than counting individual messages or visits. Check how many complete conversations your team handled in the last month (or average across a few months) and use that number as your expected monthly volume.\n■next=listen\n',
    reply: 'Please tell me your expected monthly conversation volume.',
  },
  {
    name: 'thinking-close-before-message',
    output:
      'The user wants help choosing a plan. According to the instructions, when asked to choose a plan, I should first ask for expected monthly conversations. I need to ask one question at a time and never recommend a plan before knowing that volume.\n</think>\n\n■send=message\nSure! To point you to the right plan, how many conversations do you expect to handle each month?\n■next=listen',
    reply: 'Sure! To point you to the right plan, how many conversations do you expect to handle each month?',
  },
  {
    name: 'wrong-bullet-instead-of-send',
    output:
      '● Hello! It looks like you just sent a greeting. How can I help you today? I can assist with choosing a plan or answering questions about Cedar Desk.\n■next=listen',
    reply: 'Please tell me your expected monthly conversation volume.',
  },
  {
    name: 'xml-tool-call-instead-of-protocol',
    output:
      '<tool_call>\n<function=■send=message>\nI can help with that. To start, how many conversations do you expect to have each month?\n</function>\n</tool_call>',
    reply: 'Please tell me your expected monthly conversation volume.',
  },
  {
    name: 'repeated-messages-after-listen',
    output:
      "A conversation is a back-and-forth between a visitor and your team, not a single message or page visit. To estimate monthly conversations, look at your recent conversation totals (for example, last month's total) and use that as your baseline, adjusting if your traffic is trending up or down.\n■next=listen\n■send=message\nA conversation is a back-and-forth between a visitor and your team, not a single message or page visit. To estimate monthly conversations, look at your recent conversation totals (for example, last month's total) and use that as your baseline, adjusting if your traffic is trending up or down.\n■next=listen\n■next=listen\n■send=message\nA conversation is a back-and-forth between a visitor and your team, not a single message or page visit. To estimate monthly conversations, look at your recent conversation totals (for example, last month's total) and use that as your baseline, adjusting if your traffic is trending up or down.\n■next=listen\n■next=listen\n■send=message\nA conversation is a back-and-forth between a visitor and your team, not a single message or page visit. To estimate monthly conversations, look at your recent conversation totals (for example, last month's total) and use that as your baseline, adjusting if your traffic is trending up or down.\n■next=listen\n■next=listen",
    reply: 'Please tell me your expected monthly conversation volume.',
  },
  {
    name: 'premature-listen-before-thinking-close',
    output:
      'I need to understand your expected monthly conversations before I can recommend a plan.\n\nHow many conversations do you expect to handle each month?\n■next=listen\n</think>\n\n■send=message\nI can help with that. To get started, how many conversations do you expect to handle each month?\n■next=listen',
    reply: 'Please tell me your expected monthly conversation volume.',
  },
  {
    name: 'draft-answer-before-explicit-send',
    output:
      'The user wants help choosing a plan. According to the instructions, I should first ask for expected monthly conversations. Messages, visits, and conversations are different units.\nI should ask one question at a time.\n\n"Great! To point you to the right plan, could you tell me how many conversations you expect to have each month? (Just a rough estimate is fine.)"\n\nThen wait for the user.\n\n■send=message\nGreat! To point you to the right plan, could you tell me roughly how many conversations you expect to have each month?\n■next=listen',
    reply:
      'Great! To point you to the right plan, could you tell me roughly how many conversations you expect to have each month?',
  },
] as const
