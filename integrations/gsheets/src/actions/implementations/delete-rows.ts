import { wrapAction } from '../action-wrapper'

export const deleteRows = wrapAction(
  { actionName: 'deleteRows', errorMessageWhenFailed: 'Failed to delete rows' },
  async ({ googleClient }, { sheetName, rowIndexes }) => {
    if (rowIndexes.length === 0) {
      return { deletedCount: 0 }
    }

    const { sheetId } = await googleClient.getSheetIdByName(sheetName)

    await googleClient.deleteRowsFromSheet({
      sheetId,
      rowIndexes,
    })

    return {
      deletedCount: rowIndexes.length,
    }
  }
)
