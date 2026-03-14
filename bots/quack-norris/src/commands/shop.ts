import type { CommandHandler, ProfileRow, SendFn, SetStateFn, QuestAdvanceFn } from '../lib/command-context'
import { ITEMS, formatInventory, addItemToInventory, resolveItemName } from '../lib/items'
import type { LocationId } from '../lib/locations'
import { getNpcsAtLocation, getNpcById, formatShop } from '../lib/npcs'
import { parseAdventureState, parseQuestState } from '../lib/profile'
import { saveProfile } from '../lib/save-profile'

// --- !inventory / !inv ---
const handleInventory: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const formatted = formatInventory(profile.inventory)
  await ctx.sendText(`**Your Inventory:**\n\n${formatted}`, true)
}

// --- !drop ---
const handleDrop: CommandHandler = async (ctx) => {
  if (!ctx.args[0]) {
    await ctx.sendText('Which item? Type `!drop <item name>`. Check `!inventory` to see your items.')
    return
  }

  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const itemType = resolveItemName(ctx.args.join(' '))
  if (!itemType) {
    await ctx.sendText(`Unknown item "${ctx.args.join(' ')}". Check \`!inventory\` for your items.`)
    return
  }

  const inventory = [...profile.inventory]
  const idx = inventory.findIndex((i: { type: string }) => i.type === itemType)
  if (idx < 0 || inventory[idx]!.quantity <= 0) {
    const def = ITEMS[itemType]
    await ctx.sendText(`You don't have any ${def.name} to drop.`)
    return
  }

  const def = ITEMS[itemType]
  inventory[idx] = { ...inventory[idx]!, quantity: inventory[idx]!.quantity - 1 }
  if (inventory[idx]!.quantity <= 0) {
    inventory.splice(idx, 1)
  }

  profile.inventory = inventory
  await saveProfile(profile)
  ctx.invalidateCache()

  await ctx.sendText(`${def.emoji} Dropped **${def.name}**. It sinks into the pond. Gone forever.`, true)
}

// --- !shop ---
const handleShop: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const npcsHere = getNpcsAtLocation(profile.currentLocation as LocationId)
  const shopQs = parseQuestState(profile.questState)
  const shopCompletedIds = shopQs.completedQuests.map((q) => q.questId)
  const shopNpcs = npcsHere.filter((n) => {
    if (!n.shopInventory || n.shopInventory.length === 0) {
      return false
    }
    if (n.shopRequiresQuestId && !shopCompletedIds.includes(n.shopRequiresQuestId)) {
      return false
    }
    return true
  })
  if (shopNpcs.length === 0) {
    // Check if there's a locked shop here
    const lockedShop = npcsHere.find((n) => n.shopInventory && n.shopInventory.length > 0 && n.shopRequiresQuestId)
    if (lockedShop) {
      const questDef = await import('../lib/quests').then((m) => m.getQuestById(lockedShop.shopRequiresQuestId!))
      const questName = questDef?.name ?? lockedShop.shopRequiresQuestId
      await ctx.sendText(
        `${lockedShop.emoji} **${lockedShop.name}** has a shop, but won't sell to you yet. ` +
          `Complete **${questName}** to earn their trust.`,
        true
      )
    } else {
      await ctx.sendText("There's no vendor at this location. Trenchbill hangs out at the Frozen Pond.", true)
    }
    return
  }

  const shopTexts: string[] = []
  for (const sNpc of shopNpcs) {
    const sText = formatShop(sNpc, profile.breadcrumbs ?? 0)
    if (sText) {
      shopTexts.push(sText)
    }
  }
  if (shopTexts.length === 0) {
    await ctx.sendText('The shops are empty.', true)
    return
  }

  await ctx.setInteractionState(profile, { awaitingChoice: 'shop', pendingNpcId: shopNpcs[0]!.id })
  await ctx.sendText(shopTexts.join('\n\n---\n\n'), true)
}

// --- !buy ---
const handleBuy: CommandHandler = async (ctx) => {
  if (!ctx.args[0]) {
    await ctx.sendText('Which item? Type `!buy <number>` after browsing `!shop`.')
    return
  }

  const num = parseInt(ctx.args[0], 10)
  if (isNaN(num)) {
    await ctx.sendText("That's not a number! Type `!buy <number>` after browsing `!shop`.")
    return
  }
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }
  const npcsHere = getNpcsAtLocation(profile.currentLocation as LocationId)
  const buyQs = parseQuestState(profile.questState)
  const buyCompletedIds = buyQs.completedQuests.map((q) => q.questId)
  const shopNpc = npcsHere.find((n) => {
    if (!n.shopInventory || n.shopInventory.length === 0) {
      return false
    }
    if (n.shopRequiresQuestId && !buyCompletedIds.includes(n.shopRequiresQuestId)) {
      return false
    }
    return true
  })
  if (!shopNpc?.shopInventory) {
    await ctx.sendText("There's no vendor here.", true)
    return
  }
  await ctx.setInteractionState(profile, { pendingNpcId: shopNpc.id })
  await handleShopBuy(profile, num, ctx.sendText, ctx.setInteractionState, ctx.advanceQuestObjectives)
}

// --- Shop buy handler ---
export const handleShopBuy = async (
  profile: ProfileRow,
  itemNum: number,
  send: SendFn,
  _setState: SetStateFn,
  advanceQuests?: QuestAdvanceFn
): Promise<void> => {
  const advState = parseAdventureState(profile.adventureState)
  const npcId = advState.pendingNpcId
  const npc = npcId ? getNpcById(npcId) : undefined

  if (!npc?.shopInventory) {
    await send('No shop is active. Browse with `!shop` first.', true)
    return
  }
  if (itemNum < 1 || itemNum > npc.shopInventory.length) {
    await send(`Invalid choice. Pick 1-${npc.shopInventory.length}.`)
    return
  }

  const shopItem = npc.shopInventory[itemNum - 1]!
  const bc = profile.breadcrumbs ?? 0

  if (bc < shopItem.cost) {
    await send(`Not enough breadcrumbs! You have ${bc} 🍞, need ${shopItem.cost}.`, true)
    return
  }

  const qty = shopItem.quantity ?? 1
  for (let i = 0; i < qty; i++) {
    const added = addItemToInventory(profile.inventory, shopItem.itemType)
    if (!added) {
      if (i === 0) {
        await send('Your inventory is full! Use `!drop <item>` to make room.', true)
        return
      }
      break
    }
  }

  profile.breadcrumbs = bc - shopItem.cost
  profile.adventureState = { ...profile.adventureState, awaitingChoice: 'none' }
  await saveProfile(profile)

  const itemDef = ITEMS[shopItem.itemType]
  const displayName = shopItem.label ?? itemDef.name
  const qtyText = qty > 1 ? ` x${qty}` : ''
  let purchaseText = `${itemDef.emoji} Purchased **${displayName}**${qtyText} for ${shopItem.cost} 🍞!`

  // Advance spendBreadcrumbs quest objectives
  if (advanceQuests) {
    const questMsgs = await advanceQuests('spendBreadcrumbs', String(shopItem.cost))
    if (questMsgs.length > 0) {
      purchaseText += '\n' + questMsgs.join('\n')
    }
  }

  await send(purchaseText, true)
}

export const shopCommands = new Map<string, CommandHandler>([
  ['!inventory', handleInventory],
  ['!inv', handleInventory],
  ['!drop', handleDrop],
  ['!shop', handleShop],
  ['!buy', handleBuy],
])
