import * as types from '../notion-api/types'
import * as bp from '.botpress'

export type FilesReadonlyEntity = bp.actions.Actions['filesReadonlyListItemsInFolder']['output']['items'][number]
type FilesReadonlyFile = FilesReadonlyEntity & { type: 'file' }
type FilesReadonlyFolder = FilesReadonlyEntity & { type: 'folder' }

/*
This files handles the mapping of Notion entities to Botpress files-readonly
entities. Since we're mapping Pages and Data sources to Files and Folders, we need
to be careful about the parent-child relationships, since Files cannot contain
other Files or Folders.

From the Notion API documentation:
  General parenting rules:
    - Pages can be parented by other pages, data sources, blocks, or by the whole workspace.
    - Blocks can be parented by pages, data sources, or blocks.
    - Data sources can be parented by pages, blocks, or by the whole workspace.

---

To simplify, however, we'll limit ourselves to mapping only Pages and Databases
as follows:
  - Pages are mapped to a folder and a file
    - The folder has id `pagefolder:${page.id}` and name equal to the page title
    - The file has id `page:${page.id}` and name `page.md`
  - Databases are mapped to a folder only
    - The folder has id `dbfolder:${db.id}` and name equal to the database title
  - Blocks are ignored

When we are asked to enumerate a Folder, we simply remove the folder prefix from
the id and use it to call the Notion API to get the children of the page or
database.

When we are asked to transfer a file (page) to Botpress, we fetch the page by
its id, convert it to markdown, and save it to Botpress as `page.md`.
*/

export const PREFIXES = {
  PAGE_FOLDER: 'pagefolder:',
  DB_FOLDER: 'dbfolder:',
  PAGE: 'page:',
  DB: 'db:',
} as const
export const PAGE_FILE_NAME = 'page.mdx'

export const mapEntities = (entities: types.NotionItem[]): FilesReadonlyEntity[] => entities.map(_mapEntity)

const _mapEntity = (entity: types.NotionItem): FilesReadonlyEntity => {
  if (entity.object === 'page' || (entity.object === 'block' && entity.type === 'child_page')) {
    return mapPageToFolder(entity)
  } else if (entity.object === 'data_source') {
    return mapDataSourceToFolder(entity)
  } else if (entity.object === 'block' && entity.type === 'child_database') {
    return mapDatabaseToFolder(entity)
  }
  // Default to data source folder for any other cases
  return mapDataSourceToFolder(entity as types.NotionDataSource)
}

export const mapPageToFolder = (page: types.NotionPage | types.NotionChildPage): FilesReadonlyFolder => ({
  type: 'folder',
  id: PREFIXES.PAGE_FOLDER + page.id,
  name: getPageTitle(page),
  parentId: _getParentId(page),
})

export const mapPageToFile = (page: types.NotionPage | types.NotionChildPage): FilesReadonlyFile => ({
  type: 'file',
  id: PREFIXES.PAGE + page.id,
  name: PAGE_FILE_NAME,
  parentId: PREFIXES.PAGE_FOLDER + page.id,
  lastModifiedDate: page.last_edited_time,
})

export const mapDataSourceToFolder = (ds: types.NotionDataSource): FilesReadonlyFolder => ({
  type: 'folder',
  id: PREFIXES.DB_FOLDER + ds.id,
  name: getDataSourceTitle(ds),
  parentId: _getParentId(ds),
})

export const mapDatabaseToFolder = (db: types.NotionChildDatabase): FilesReadonlyFolder => ({
  type: 'folder',
  id: PREFIXES.DB_FOLDER + db.id,
  name: getDatabaseTitle(db),
  parentId: _getParentId(db),
})

export const getPageTitle = (page: types.NotionPage | types.NotionChildPage): string => {
  if (page.object === 'block') {
    return page.child_page.title
  }
  const titleProperty = Object.values(page.properties)
    .filter((prop) => prop.type === 'title')
    .find((prop) => prop.title[0]?.plain_text)

  return titleProperty?.title[0]?.plain_text ?? `Untitled Page (${_uuidToShortId(page.id)})`
}

export const getDataSourceTitle = (ds: types.NotionDataSource): string => {
  return ds.title[0]?.plain_text ?? `Untitled Data Source (${_uuidToShortId(ds.id)})`
}

export const getDatabaseTitle = (db: types.NotionChildDatabase): string => {
  return db.child_database.title
}

const _uuidToShortId = (uuid: string): string => uuid.replaceAll('-', '')

const _getParentId = ({ parent }: types.NotionItem): string | undefined => {
  switch (parent.type) {
    case 'page_id':
      return PREFIXES.PAGE_FOLDER + parent.page_id
    case 'database_id':
      return PREFIXES.DB_FOLDER + parent.database_id
    case 'data_source_id':
      return PREFIXES.DB_FOLDER + parent.data_source_id
    case 'block_id':
      break
    case 'workspace':
      break
    default:
      parent satisfies never
  }
  return undefined
}
