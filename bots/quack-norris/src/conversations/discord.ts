import { Conversation, z, actions } from '@botpress/runtime'
import {
  commandRegistry,
  handleEncounterChoice,
  handleTravelChoice,
  handleQuestChoice,
  handleQuestAccept,
  handleShopBuy,
} from '../commands'
import type { ProfileRow, InteractionState, CommandContext } from '../lib/command-context'
import { LOCATIONS, type LocationId } from '../lib/locations'
import { parseAdventureState, parseMessagePayload } from '../lib/profile'
import { renderHud, type HudProfile } from '../lib/progression'
import { advanceQuestObjectivesForProfile, completeQuestForProfile } from '../lib/quest-engine'
import { buildQuestLookup, getGeneratedQuestsFromProfile } from '../lib/quest-generator'
import { getQuestById, getQuestStepProgress, type QuestProgress } from '../lib/quests'
import { saveProfile } from '../lib/save-profile'
import { PlayersTable } from '../tables/Players'

export const Discord = new Conversation({
  channel: 'discord.guildText',

  state: z.object({
    activeGameId: z.string().optional(),
  }),

  async handler({ message, conversation, state }) {
    if (!message) {
      return
    }

    const payload = parseMessagePayload((message as unknown as { payload?: unknown }).payload)
    const text = (payload.text ?? '').trim()
    const [command, ...args] = text.split(/\s+/)

    const discordUserId = message.tags['discord:userId'] ?? message.userId
    const channelId = message.tags['discord:channelId'] ?? ''
    const convTags = (conversation as unknown as { tags: Record<string, string | undefined> }).tags
    const guildId = convTags['discord:guildId']
    const stateRef = state as { activeGameId?: string }

    // --- Profile cache with TTL (5s expiry to avoid stale reads from concurrent commands) ---
    const CACHE_TTL_MS = 5_000
    let cachedProfile: ProfileRow | null = null
    let cacheTimestamp = 0
    const invalidateCache = (): void => {
      cachedProfile = null
      cacheTimestamp = 0
    }

    const loadProfile = async (): Promise<ProfileRow | null> => {
      if (cachedProfile && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
        return cachedProfile
      }
      const { rows } = await PlayersTable.findRows({ filter: { discordUserId }, limit: 1 })
      cachedProfile = rows[0] ?? null
      cacheTimestamp = Date.now()
      return cachedProfile
    }

    const withProfile = async (
      mutate: (profile: ProfileRow) => ProfileRow | Promise<ProfileRow>
    ): Promise<ProfileRow | null> => {
      const { rows } = await PlayersTable.findRows({ filter: { discordUserId }, limit: 1 })
      const profile = rows[0] as ProfileRow | undefined
      if (!profile) {
        return null
      }
      const updated = await mutate(profile)
      await saveProfile(updated)
      cachedProfile = updated
      cacheTimestamp = Date.now()
      return updated
    }

    // --- Interaction state helpers ---
    const getInteractionState = (profile: { adventureState: Record<string, unknown> }): InteractionState => {
      const parsed = parseAdventureState(profile.adventureState)
      return {
        awaitingChoice: parsed.awaitingChoice ?? 'none',
        pendingQuestId: parsed.pendingQuestId,
        pendingNpcId: parsed.pendingNpcId,
      }
    }

    const setInteractionState = async (profile: ProfileRow, update: Partial<InteractionState>): Promise<void> => {
      await withProfile((p) => ({
        ...p,
        adventureState: { ...p.adventureState, ...update },
      }))
      Object.assign(profile.adventureState, update)
    }

    // --- Display name helper ---
    const getDisplayName = async (): Promise<string> => {
      if (guildId) {
        try {
          const member = await actions.discord.getGuildMember({ guildId, userId: discordUserId })
          const m = member as { nick?: string | null; user?: { username?: string; globalName?: string | null } }
          return m.nick ?? m.user?.globalName ?? m.user?.username ?? `Duck_${discordUserId.slice(-4)}`
        } catch {
          return `Duck_${discordUserId.slice(-4)}`
        }
      }
      return 'Unknown Duck With No Guild'
    }

    // --- Send text with optional HUD ---
    const sendText = async (t: string, showHud = false): Promise<void> => {
      let finalText = t
      if (showHud) {
        const profile = await loadProfile()
        if (profile && profile.level !== undefined) {
          const loc = LOCATIONS[profile.currentLocation as LocationId]
          const hudProfile: HudProfile = {
            displayName: profile.displayName,
            title: profile.title ?? 'Fledgling',
            level: profile.level ?? 1,
            xp: profile.xp ?? 0,
            breadcrumbs: profile.breadcrumbs ?? 0,
            currentLocation: profile.currentLocation,
            inventory: profile.inventory as HudProfile['inventory'],
            questState: profile.questState ?? { activeQuests: [] },
          }
          const activeQ = hudProfile.questState.activeQuests[0]
          let questName: string | undefined
          let questProgress: string | undefined
          if (activeQ) {
            const def = getQuestById(activeQ.questId)
            if (def) {
              questName = def.name
              questProgress = getQuestStepProgress(activeQ as QuestProgress, def)
            }
          }
          finalText +=
            '\n' +
            renderHud(hudProfile, loc?.emoji ?? '📍', loc?.name ?? profile.currentLocation, questName, questProgress)
        }
      }
      await conversation.send({ type: 'text', payload: { text: finalText } })
    }

    // --- Quest objective advancement (delegates to extracted pure logic) ---
    const advanceQuestObjectives = async (
      eventType: Parameters<typeof advanceQuestObjectivesForProfile>[1],
      eventTarget?: string
    ): Promise<string[]> => {
      const result = { messages: [] as string[] }

      await withProfile((profile) => {
        const lookup = buildQuestLookup(getGeneratedQuestsFromProfile(profile.questState))
        const advance = advanceQuestObjectivesForProfile(profile, eventType, eventTarget, lookup)
        result.messages = advance.messages
        if (advance.interactionUpdate) {
          profile.adventureState = { ...profile.adventureState, ...advance.interactionUpdate }
        }
        return profile
      })

      return result.messages
    }

    // --- Quest completion (thin wrapper around extracted pure logic) ---
    const completeQuest = async (
      profile: ProfileRow,
      quest: QuestProgress,
      def: ReturnType<typeof getQuestById> & object
    ): Promise<string[]> => {
      return completeQuestForProfile(profile, quest, def)
    }

    // --- Choice handling (numbered responses for pending states) ---
    const choiceNum = parseInt(text, 10)
    if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= 8) {
      const profile = await loadProfile()
      if (profile) {
        const iState = getInteractionState(profile)

        if (iState.awaitingChoice === 'encounter' && profile.adventureState.activeEncounterId) {
          await handleEncounterChoice(profile, choiceNum, sendText, setInteractionState, advanceQuestObjectives)
          return
        }

        if (iState.awaitingChoice === 'travel') {
          await handleTravelChoice(profile, choiceNum, sendText, setInteractionState, advanceQuestObjectives)
          return
        }

        if (iState.awaitingChoice === 'quest_choice' && iState.pendingQuestId) {
          await handleQuestChoice(profile, choiceNum, sendText, setInteractionState, completeQuest)
          return
        }

        if (iState.awaitingChoice === 'quest_accept' && iState.pendingQuestId) {
          if (choiceNum === 1) {
            await handleQuestAccept(profile, sendText, setInteractionState)
            return
          } else {
            await setInteractionState(profile, {
              awaitingChoice: 'none',
              pendingQuestId: undefined,
            })
            await sendText('Maybe another time.', true)
            return
          }
        }

        if (iState.awaitingChoice === 'shop' && iState.pendingNpcId) {
          await handleShopBuy(profile, choiceNum, sendText, setInteractionState, advanceQuestObjectives)
          return
        }

        // Number typed but nothing pending — ignore (normal chatter)
      }
      return
    }

    // --- Pending choice reminder or first-message onboarding for unrecognized input ---
    if (command && !command.startsWith('!')) {
      const pendProfile = await loadProfile()
      if (pendProfile) {
        const pendState = getInteractionState(pendProfile)
        if (pendState.awaitingChoice !== 'none') {
          const reminders: Record<string, string> = {
            encounter: '*The encounter still looms before you.* Pick a number to act, or `!cancel` to flee.',
            travel: '*The crossroads await your decision.* Pick a destination number, or `!cancel` to stay put.',
            quest_choice: '*A quest decision hangs in the balance.* Choose a number, or `!cancel` to step back.',
            quest_accept: '*An NPC watches you expectantly.* **1** to accept, **2** to decline, or `!cancel`.',
            shop: '*The vendor taps their foot impatiently.* Pick an item number, or `!cancel` to walk away.',
          }
          await sendText(
            reminders[pendState.awaitingChoice] ?? 'You have a pending choice. Reply with a number or `!cancel`.',
            true
          )
          return
        }
        // Existing player typed non-command text with no pending state — ignore silently
        // (normal Discord chatter shouldn't trigger bot responses)
      } else {
        // First-time player onboarding
        await sendText(
          '*A ripple crosses the pond. Something stirs.*\n\n' +
            "Welcome to **The Pond Eternal**, brave duck. You've wandered into a world of quests, combat, and questionable life choices.\n\n" +
            'Type `!startGame` to begin your adventure, or `!help` to see what awaits you.'
        )
        return
      }
      return
    }

    // --- Pending-state guard for commands that would start new interactions ---
    const interactionCommands = new Set(['!explore', '!travel', '!talk', '!shop', '!daily'])
    if (command && interactionCommands.has(command.toLowerCase())) {
      const guardProfile = await loadProfile()
      if (guardProfile) {
        const guardState = getInteractionState(guardProfile)
        if (guardState.awaitingChoice !== 'none') {
          const guardReminders: Record<string, string> = {
            encounter: '*The encounter demands your attention!* Finish it first (pick a number) or `!cancel` to flee.',
            travel: '*The crossroads still await!* Pick a destination or `!cancel` to stay.',
            quest_choice: '*A quest decision still hangs in the air.* Choose a number or `!cancel`.',
            quest_accept: '*An NPC is still waiting for your answer.* **1** to accept, **2** to decline, or `!cancel`.',
            shop: '*The vendor clears their throat.* Pick an item number or `!cancel` to leave.',
          }
          await sendText(
            guardReminders[guardState.awaitingChoice] ??
              '*Something requires your attention.* Finish it first or `!cancel`.',
            true
          )
          return
        }
      }
    }

    // --- Command dispatch via registry (case-insensitive) ---
    const handler = command ? commandRegistry.get(command.toLowerCase()) : undefined
    if (handler) {
      const ctx: CommandContext = {
        command: command!,
        discordUserId,
        channelId,
        guildId,
        args,
        message: {
          id: message.id,
          userId: message.userId,
          tags: message.tags as Record<string, string | undefined>,
        },
        sendText,
        loadProfile,
        setInteractionState,
        getDisplayName,
        advanceQuestObjectives,
        completeQuest,
        withProfile,
        invalidateCache,
        stateRef,
        convTags,
        actions,
        conversation: {
          id: conversation.id,
          send: conversation.send.bind(conversation),
        },
      }
      await handler(ctx)
    } else if (command?.startsWith('!')) {
      await sendText(`Unknown command \`${command}\`. Type \`!help\` to see available commands.`)
    }
  },
})
