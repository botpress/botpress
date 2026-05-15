import { z } from '@botpress/sdk'
import { createFolderSchema } from '../../definitions/actions/create-folder'
import {
  grafanaFolderK8sCreateFolder,
  grafanaFolderK8sDeleteFolder,
  grafanaFolderK8sListFolder,
} from '../grafana-k8s-client'
import { type GrafanaConfig, k8sClient } from './config'
import { errorMessage } from './utils'

type CreateFolderInput = z.infer<typeof createFolderSchema>

export async function createFolder(
  config: GrafanaConfig,
  ns: string,
  input: CreateFolderInput
): Promise<{ success: boolean; uid?: string; error?: string }> {
  const { data, error } = await grafanaFolderK8sCreateFolder({
    client: k8sClient(config),
    path: { namespace: ns },
    body: {
      metadata: {
        namespace: ns,
        ...(input.uid ? { name: input.uid } : { generateName: 'f-' }),
        ...(input.parentUid ? { labels: { 'grafana.app/folder': input.parentUid } } : {}),
      },
      spec: {
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
      },
    },
  })
  if (error || !data) return { success: false, error: errorMessage(error) }
  return { success: true, uid: data.metadata.name }
}

export async function listFolders(
  config: GrafanaConfig,
  ns: string
): Promise<{ success: boolean; data?: { uid?: string; title?: string; parentUid?: string }[]; error?: string }> {
  const { data, error } = await grafanaFolderK8sListFolder({
    client: k8sClient(config),
    path: { namespace: ns },
  })
  if (error || !data) return { success: false, error: errorMessage(error) }
  const items = data.items.map((f) => ({
    uid: f.metadata.name,
    title: f.spec.title,
    parentUid: f.metadata.labels?.['grafana.app/folder'],
  }))
  return { success: true, data: items }
}

export async function deleteFolder(
  config: GrafanaConfig,
  ns: string,
  folderUid: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await grafanaFolderK8sDeleteFolder({
    client: k8sClient(config),
    path: { namespace: ns, name: folderUid },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}
