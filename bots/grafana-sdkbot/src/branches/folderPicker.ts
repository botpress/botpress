import { GRAFANA } from '../const'
import type { CreateFolderForm } from '../types'
import { Client, getFlowState, goToMainMenu, pickFromList, reply, setFlowState, setTags, showList } from '../utils'

const OPTIONAL_FIELDS: { key: keyof CreateFolderForm; label: string }[] = [
  { key: 'uid', label: 'UID' },
  { key: 'parentUid', label: 'Parent folder UID' },
  { key: 'description', label: 'Description' },
]

const CREATE_FOLDER_CONTROLS = [
  { label: 'Create folder', value: '0' },
  { label: 'Cancel', value: '-1' },
]

const showCreateFolderMenu = async (client: Client, conversationId: string, userId: string, form: CreateFolderForm) => {
  const items = OPTIONAL_FIELDS.map((f) => `${f.label}: ${form[f.key] ?? '(not set)'}`)
  await showList(client, conversationId, userId, 'Optional fields:', items, CREATE_FOLDER_CONTROLS)
}

export const startFolderPicker = async (
  client: Client,
  conversationId: string,
  userId: string,
  returnBranch: string
) => {
  let folders
  try {
    const { output } = await client.callAction({ type: `${GRAFANA}:listFolders`, input: {} })
    folders = output.folders
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Failed to load folders: ${err instanceof Error ? err.message : String(err)}`
    )
    await goToMainMenu(client, conversationId, userId)
    return
  }

  await setFlowState(client, conversationId, { folderPickerReturnBranch: returnBranch })

  if (!folders?.length) {
    await setFlowState(client, conversationId, { createFolderForm: {} })
    await reply(client, conversationId, userId, 'No folders found. Enter a title to create one:')
    await setTags(client, conversationId, { branch: 'folder_picker', step: 'create_title' })
    return
  }

  await setFlowState(client, conversationId, { folders })
  await showList(
    client,
    conversationId,
    userId,
    'Pick a folder:',
    folders.map((f) => f.title ?? ''),
    [{ label: 'Create new folder', value: '0' }]
  )
  await setTags(client, conversationId, { branch: 'folder_picker', step: '' })
}

export const handleFolderPicker = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  onSelected: (uid: string) => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)

  if (step === 'create_title') {
    const form: CreateFolderForm = { title: input }
    await setFlowState(client, conversationId, { createFolderForm: form })
    await showCreateFolderMenu(client, conversationId, userId, form)
    await setTags(client, conversationId, { branch: 'folder_picker', step: 'create_optional' })
    return
  }

  if (step === 'create_optional') {
    const form = state.createFolderForm ?? {}
    if (input === '-1') {
      await reply(client, conversationId, userId, 'Folder creation cancelled.')
      await goToMainMenu(client, conversationId, userId)
      return
    }
    if (input === '0') {
      await submitCreateFolder(client, conversationId, userId, form, onSelected)
      return
    }
    const index = Number.parseInt(input) - 1
    const field = OPTIONAL_FIELDS[index]
    if (!field || Number.isNaN(index)) {
      await reply(client, conversationId, userId, 'Invalid option.')
      await showCreateFolderMenu(client, conversationId, userId, form)
      return
    }
    await reply(client, conversationId, userId, `Enter value for "${field.label}":`)
    await setTags(client, conversationId, { branch: 'folder_picker', step: `create_set_${field.key}` })
    return
  }

  if (step.startsWith('create_set_')) {
    const key = step.replace('create_set_', '') as keyof CreateFolderForm
    const updatedForm = { ...state.createFolderForm, [key]: input }
    await setFlowState(client, conversationId, { createFolderForm: updatedForm })
    await showCreateFolderMenu(client, conversationId, userId, updatedForm)
    await setTags(client, conversationId, { branch: 'folder_picker', step: 'create_optional' })
    return
  }

  // Folder list selection
  const folders = state.folders ?? []

  if (input === '0') {
    await setFlowState(client, conversationId, { createFolderForm: {} })
    await reply(client, conversationId, userId, 'Enter folder title:')
    await setTags(client, conversationId, { branch: 'folder_picker', step: 'create_title' })
    return
  }

  const folder = pickFromList(folders, input)
  if (!folder) {
    await showList(
      client,
      conversationId,
      userId,
      'Invalid choice. Pick a folder:',
      folders.map((f) => f.title ?? ''),
      [{ label: 'Create new folder', value: '0' }]
    )
    return
  }

  await onSelected(folder.uid ?? '')
}

const submitCreateFolder = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: CreateFolderForm,
  onSelected: (uid: string) => Promise<void>
) => {
  try {
    const { output } = await client.callAction({
      type: `${GRAFANA}:createFolder`,
      input: {
        title: form.title!,
        ...(form.uid && { uid: form.uid }),
        ...(form.parentUid && { parentUid: form.parentUid }),
        ...(form.description && { description: form.description }),
      },
    })
    await reply(client, conversationId, userId, `Folder "${form.title}" created.`)
    await onSelected(output.uid)
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Failed to create folder: ${err instanceof Error ? err.message : String(err)}`
    )
    await goToMainMenu(client, conversationId, userId)
  }
}
