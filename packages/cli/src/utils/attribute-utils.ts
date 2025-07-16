import * as records from './record-utils'

type ItemsWithAttributes = Record<
  string,
  {
    attributes?: {
      [key: string]: string | null
    }
  } | null
>

export const prepareAttributeUpdateBody = <TLocalItems extends ItemsWithAttributes>({
  localItems,
  remoteItems,
}: {
  localItems: TLocalItems
  remoteItems: ItemsWithAttributes
}): TLocalItems => {
  const clonedLocalItems = structuredClone(localItems)

  for (const [itemName, item] of Object.entries(clonedLocalItems)) {
    if (!item || !remoteItems || !remoteItems[itemName]) {
      continue
    }

    item.attributes = records.setNullOnMissingValues(item.attributes, remoteItems[itemName].attributes ?? {})
  }

  return clonedLocalItems
}
