import { parse, relative } from 'path'
import { watch } from '../utils/file-watcher'
import { z } from '@botpress/sdk'
import { cwd } from 'process'
import { generateAction, generateGlobals, generateEntity, initAction } from '../generator'

export const devCommand = async () => {
  ;(global as any).z = z

  await watch('src', async (_, events) => {
    for (const event of events) {
      if (event.type === 'create') {
        await initAction(event.path)
      } else if (event.type === 'update') {
        const path = parse(event.path)
        const relativePath = relative(cwd(), path.dir)

        if (relativePath === 'src/actions') {
          await generateAction({ path: event.path })
        }

        if (relativePath === 'src/entities') {
          await generateEntity({ path: event.path })
        }
      }
    }

    await generateGlobals()
  })
}
