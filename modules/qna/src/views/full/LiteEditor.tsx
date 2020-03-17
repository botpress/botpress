import { Breadcrumbs, Button, ControlGroup, InputGroup, Intent } from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'
import { AccessControl } from 'botpress/utils'
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'
import Editor from './Editor'
import Item from './Item'

interface Props {
  bp: any
  topicName: string
  contentLang: string
}

interface QnaEntry {
  id: string
  data: any
}

export const LiteEditor: FC<Props> = props => {
  const [filter, setFilter] = useState('')
  const [editId, setEditId] = useState('')
  const [isEditing, setEditing] = useState(false)
  const [data, setData] = useState<QnaEntry[]>()
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    fetchData()
  }, [])

  const getQueryParams = () => {
    return {
      params: {
        question: filter,
        filteredContexts: [props.topicName]
      }
    }
  }

  const fetchData = async () => {
    const { data } = await props.bp.axios.get('/mod/qna/questions', getQueryParams())
    setData(data.items)
  }

  const createNew = () => {
    setEditId('')
    setEditing(true)
  }

  const editItem = itemId => {
    setEditId(itemId)
    setEditing(true)
  }

  const cancelEditing = () => setEditing(false)

  const deleteItem = async (id: string) => {
    const needDelete = await confirmDialog('Do you want to delete the question?', {
      acceptLabel: 'Delete'
    })

    if (needDelete) {
      const { data } = await props.bp.axios.post(`/mod/qna/questions/${id}/delete`, getQueryParams())
      setData(data.items)
    }
  }

  const updateFilter = async text => {
    setFilter(text)
    await fetchData()
  }

  const toggleEnableItem = async (item: any, id: string, isChecked: boolean) => {
    item.enabled = isChecked

    const { data } = await props.bp.axios.post(`/mod/qna/questions/${id}`, item, getQueryParams())
    setData(data.items)
  }

  return (
    <div>
      {!isEditing && (
        <div className={style.liteHeader}>
          <div className={style.liteSearch}>
            <InputGroup
              id="input-search"
              placeholder="Search for a question"
              tabIndex={1}
              value={filter}
              onChange={e => updateFilter(e.currentTarget.value)}
            />
          </div>

          <AccessControl resource="module.qna" operation="write">
            <Button
              id="btn-create-qna"
              text="Add Question"
              icon="add"
              style={{ marginLeft: 20 }}
              intent={Intent.PRIMARY}
              onClick={() => createNew()}
            />
          </AccessControl>

          {/*
          TODO: Support for import/export scoped to a category
          <div>
            <Popover minimal position={Position.BOTTOM} captureDismiss>
              <Button id="btn-menu" icon="menu" minimal style={{ float: 'right' }} />
              <Menu>
                <MenuItem
                  icon="download"
                  id="btn-importJson"
                  text="Import JSON"
                  onClick={() => setImportDialogOpen(true)}
                />

                <ExportButton asMenu />
              </Menu>
            </Popover>
            <ImportModal
              isOpen={importDialogOpen}
              toggle={() => setImportDialogOpen(!importDialogOpen)}
              axios={props.bp.axios}
              onImportCompleted={fetchData}
            />
          </div> */}
        </div>
      )}

      {!isEditing && data && (
        <div className={style.liteItemContainer}>
          <div className={style.questionTable}>
            <div className={cx(style.questionTableRow, style.header)}>
              <div className={cx(style.questionTableCell, style.question)}>Question</div>
              <div className={style.questionTableCell}>Answer</div>
              <div className={cx(style.questionTableCell, style.actions)}></div>
            </div>
            {data.map(item => (
              <Item
                key={item.id}
                id={item.id}
                item={item.data}
                isLite
                contentLang={props.contentLang}
                onEditItem={editItem}
                onDeleteItem={deleteItem}
                onToggleItem={toggleEnableItem}
              />
            ))}
          </div>
        </div>
      )}
      <div>
        {isEditing && (
          <div>
            <Breadcrumbs
              items={[
                { onClick: cancelEditing, text: 'Q&A' },
                { text: editId !== '' ? 'Edit Q&A' : 'Create a new Q&A' }
              ]}
            />

            <Editor
              {...{ ...props }}
              closeQnAModal={cancelEditing}
              fetchData={fetchData}
              id={editId}
              isEditing={editId !== ''}
              page={{ offset: 0, limit: 500 }}
              isLite
              hideContexts
              defaultContext={props.topicName}
              updateQuestion={questions => setData(questions.items)}
              filters={{ question: filter, contexts: [props.topicName] }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
