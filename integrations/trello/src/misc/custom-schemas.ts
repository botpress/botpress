import z from 'zod'

import { TrelloIDSchema, LimitsObjectSchema, MemberPrefsSchema } from './sub-schemas'

export const createCardInputSchema = z.object({
  name: z.string().describe('The name of the card (e.g. "My Test Card")'),
  listId: z.string().describe('The ID of the list to add the card to (e.g. "5f5f7f7f7f7f7f7f7f7f7f7f")'),
  desc: z
    .string()
    .optional()
    .describe('The description of the card (Optional) (e.g. "This is my test card created using the Trello API")'),
  due: z
    .string()
    .optional()
    .describe('The due date of the card in ISO format (Optional) (e.g. "2023-08-15T15:00:00.000Z")'),
  idMembers: z
    .string()
    .optional()
    .describe(
      'The member IDs should be strings separated by commas (Optional) (e.g. "5f5f5f5f5f5f5f5f5f5f5f5f, 6g6g6g6g6g6g6g6g6g6g6g6g")'
    ),
  idLabels: z
    .string()
    .optional()
    .describe(
      'The label IDs should be strings separated by commas (Optional) (e.g. "5e5e5e5e5e5e5e5e5e5e5e5e, 4d4d4d4d4d4d4d4d4d4d4d4d")'
    ),
})

export const createCardOutputSchema = z.object({
  id: z.string(),
  url: z.string(),
})

export const updateCardInputSchema = createCardInputSchema.extend({
  cardId: z.string().describe('Card ID to update'),
  name: z.string().describe('The name of the card (Optional) (e.g. "My Test Card")').optional(),
  listId: z
    .string()
    .describe('The ID of the list to add the card to (Optional) (e.g. "5f5f7f7f7f7f7f7f7f7f7f7f")')
    .optional(),
  closed: z
    .string()
    .optional()
    .describe(
      'If the card is closed, enter "true". If the card is open, enter "false" (without quotes). If no value is entered, it will keep its previous status. (Optional)'
    )
    .optional(),
  dueComplete: z
    .string()
    .optional()
    .describe(
      'If the card is due complete, enter "true". If the card is not due complete, enter "false" (without quotes). If no value is entered, it will keep its previous status. (Optional)'
    )
    .optional(),
})

export const updateCardOutputSchema = createCardOutputSchema

export const getMemberInputSchema = z.object({
  usernameOrId: z.string().describe('Trello username or Trello ID (e.g. miuser5 or 6497b46edeb36c99f68he834)'),
})

export const getMemberOutputSchema = z
  .object({
    id: TrelloIDSchema.nullable(),
    activityBlocked: z.boolean().nullable(),
    avatarHash: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    bio: z.string().nullable(),
    bioData: z
      .object({
        emoji: z.record(z.any()),
      })
      .nullable(),
    confirmed: z.boolean().nullable(),
    fullName: z.string().nullable(),
    idEnterprise: TrelloIDSchema.nullable(),
    idEnterprisesDeactivated: z.array(TrelloIDSchema).nullable(),
    idMemberReferrer: TrelloIDSchema.nullable(),
    idPremOrgsAdmin: z.array(TrelloIDSchema).nullable(),
    initials: z.string().nullable(),
    memberType: z.string().nullable(),
    nonPublic: z.record(z.any()).nullable(),
    nonPublicAvailable: z.boolean().nullable(),
    products: z.array(z.number()).nullable(),
    url: z.string().nullable(),
    username: z.string().nullable(),
    status: z.string().nullable(),
    aaEmail: z.string().nullable(),
    aaEnrolledDate: z.string().nullable(),
    aaId: z.string().nullable(),
    avatarSource: z.string().nullable(),
    email: z.string().nullable(),
    gravatarHash: z.string().nullable(),
    idBoards: z.array(TrelloIDSchema).nullable(),
    idOrganizations: z.array(TrelloIDSchema).nullable(),
    idEnterprisesAdmin: z.array(TrelloIDSchema).nullable(),
    limits: LimitsObjectSchema.nullable(),
    loginTypes: z.array(z.string()).nullable(),
    marketingOptIn: z
      .object({
        optedIn: z.boolean().optional().nullable(),
        date: z.string().optional().nullable(),
      })
      .nullable(),
    messagesDismissed: z
      .object({
        name: z.string().optional().nullable(),
        count: z.string().optional().nullable(),
        lastDismissed: z.string().optional().nullable(),
        Id: TrelloIDSchema.optional().nullable(),
      })
      .or(z.any())
      .nullable(),
    oneTimeMessagesDismissed: z.array(z.string()).nullable(),
    prefs: MemberPrefsSchema.nullable(),
    trophies: z.array(z.string()).nullable(),
    uploadedAvatarHash: z.string().nullable(),
    uploadedAvatarUrl: z.string().nullable(),
    premiumFeatures: z.array(z.string()).nullable(),
    isAaMastered: z.boolean().nullable(),
    ixUpdate: z.number().or(z.string()).nullable(),
    idBoardsPinned: z.array(TrelloIDSchema).nullable(),
  })
  .deepPartial()

export const addCommentInputSchema = z.object({
  cardId: z.string().describe('Card ID to comment'),
  comment: z.string().describe('Content of the comment to be added'),
})

export const addCommentOutputSchema = z.object({
  text: z.string(),
})

export const getBoardMembersInputSchema = z.object({
  boardId: z.string().describe('The ID of the board (e.g kLmNoPqR)'),
})

export const getBoardMembersOutputSchema = z.object({
  members: z.array(getMemberOutputSchema).nullable(),
})
