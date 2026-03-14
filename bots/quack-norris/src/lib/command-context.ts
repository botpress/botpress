import type { actions } from '@botpress/runtime'
import type { PlayersTable } from '../tables/Players'
import type { QuestProgress, QuestObjectiveType, getQuestById } from './quests'

export type ProfileRow = Awaited<ReturnType<typeof PlayersTable.findRows>>['rows'][0]

export type AwaitingChoice = 'encounter' | 'travel' | 'quest_choice' | 'quest_accept' | 'shop' | 'none'

export type InteractionState = {
  awaitingChoice: AwaitingChoice
  pendingQuestId?: string
  pendingNpcId?: string
}

export type SendFn = (text: string, showHud?: boolean) => Promise<unknown>

export type SetStateFn = (profile: ProfileRow, update: Partial<InteractionState>) => Promise<void>

export type QuestAdvanceFn = (eventType: QuestObjectiveType, eventTarget?: string) => Promise<string[]>

export type CompleteQuestFn = (
  profile: ProfileRow,
  quest: QuestProgress,
  def: ReturnType<typeof getQuestById> & object
) => Promise<string[]>

export type CommandContext = {
  command: string
  discordUserId: string
  channelId: string
  guildId: string | undefined
  args: string[]
  message: { id: string; userId: string; tags: Record<string, string | undefined> }
  sendText: SendFn
  loadProfile: () => Promise<ProfileRow | null>
  setInteractionState: SetStateFn
  getDisplayName: () => Promise<string>
  advanceQuestObjectives: QuestAdvanceFn
  completeQuest: CompleteQuestFn
  withProfile: (mutate: (profile: ProfileRow) => ProfileRow | Promise<ProfileRow>) => Promise<ProfileRow | null>
  invalidateCache: () => void
  stateRef: { activeGameId?: string }
  convTags: Record<string, string | undefined>
  actions: typeof actions
  conversation: { id: string; send: (msg: { type: string; payload: { text: string } }) => Promise<void> }
}

export type CommandHandler = (ctx: CommandContext) => Promise<void>
