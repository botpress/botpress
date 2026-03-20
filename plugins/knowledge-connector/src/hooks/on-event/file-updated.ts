import { handleFileUpsert } from './file-upserted'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileUpdated'] = async (props) => {
  await handleFileUpsert(props)
}
