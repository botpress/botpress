import z from 'zod'

const AvatarUrlsSchema = z.object({
  '16x16': z.string().optional(),
  '24x24': z.string().optional(),
  '32x32': z.string().optional(),
  '48x48': z.string().optional(),
})

const ListWrapperCallbackGroupNameSchema = z.object({})
const ListWrapperCallbackApplicationRoleSchema = z.object({})

const GroupNameSchema = z.object({
  name: z.string().optional(),
  groupId: z.string().optional(),
  self: z.string().optional(),
})

const SimpleListWrapperGroupNameSchema = z.object({
  size: z.number().optional(),
  items: z.array(GroupNameSchema).optional(),
  pagingCallback: ListWrapperCallbackGroupNameSchema.optional(),
  callback: ListWrapperCallbackGroupNameSchema.optional(),
  'max-results': z.number().optional(),
})

const ApplicationRoleSchema = z.object({
  key: z.string().optional(),
  groups: z.array(z.string()).optional(),
  groupDetails: z.array(GroupNameSchema).optional(),
  name: z.string().optional(),
  defaultGroups: z.array(z.string()).optional(),
  defaultGroupsDetails: z.array(GroupNameSchema).optional(),
  selectedByDefault: z.boolean().optional(),
  defined: z.boolean().optional(),
  numberOfSeats: z.number().optional(),
  remainingSeats: z.number().optional(),
  userCount: z.number().optional(),
  userCountDescription: z.string().optional(),
  hasUnlimitedSeats: z.boolean().optional(),
  platform: z.boolean().optional(),
})

const SimpleListWrapperApplicationRoleSchema = z.object({
  size: z.number().optional(),
  items: z.array(ApplicationRoleSchema).optional(),
  pagingCallback: ListWrapperCallbackApplicationRoleSchema.optional(),
  callback: ListWrapperCallbackApplicationRoleSchema.optional(),
  'max-results': z.number().optional(),
})

export {
  AvatarUrlsSchema,
  ListWrapperCallbackApplicationRoleSchema,
  ListWrapperCallbackGroupNameSchema,
  GroupNameSchema,
  SimpleListWrapperGroupNameSchema,
  ApplicationRoleSchema,
  SimpleListWrapperApplicationRoleSchema,
}
