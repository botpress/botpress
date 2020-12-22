import { Colors, Icon, MenuItem, Position, Tooltip } from '@blueprintjs/core'
import { ItemRenderer, MultiSelect } from '@blueprintjs/select'
import { lang } from 'botpress/shared'
import React, { FC, Fragment, useEffect, useState } from 'react'

interface Props {
  contexts: string[]
  isSearch?: boolean
  customIdSuffix?: string | number
  className?: string
  bp: any
  saveContexts: (ctx: string[]) => void
}

const ContextSelector: FC<Props> = props => {
  const [availableContexts, setContexts] = useState([])
  const contexts = props.contexts || []

  useEffect(() => {
    props.bp.axios.get('/nlu/contexts').then(({ data }) => setContexts(data))
  }, [])

  const removeCtx = (_, idx: number) => {
    props.saveContexts([...contexts.slice(0, idx), ...contexts.slice(idx + 1)])
  }

  const addCtx = (ctx: string) => {
    if (availableContexts.indexOf(ctx) === -1) {
      setContexts([...availableContexts, ctx])
    }
    props.saveContexts([...contexts, ctx])
  }

  const onItemSelect = (ctx: string) => {
    const idx = contexts?.indexOf(ctx)
    if (idx !== -1) {
      removeCtx(ctx, idx)
    } else {
      addCtx(ctx)
    }
  }

  const ctxItemRenderer: ItemRenderer<string> = (ctx, { handleClick, modifiers }) => (
    <MenuItem
      text={ctx}
      key={ctx}
      onClick={handleClick}
      active={modifiers.active}
      icon={contexts?.indexOf(ctx) !== -1 ? 'tick' : 'blank'}
    />
  )

  const createNewItemRenderer = (query: string, active: boolean, handleClick) => (
    <MenuItem
      icon="plus"
      text={lang.tr('module.qna.context.createQuery')}
      active={active}
      onClick={handleClick}
      shouldDismissPopover={false}
    />
  )

  return (
    <div className={props.className}>
      <div>
        {!props.isSearch && (
          <Fragment>
            <label htmlFor="selectContext">{lang.tr('module.qna.context.title')}</label>
            &nbsp;
            <Tooltip content={lang.tr('module.qna.context.canTypeToCreate')} position={Position.RIGHT}>
              <Icon color={Colors.GRAY2} icon="info-sign" />
            </Tooltip>
          </Fragment>
        )}
      </div>

      <MultiSelect
        placeholder={
          props.isSearch ? lang.tr('module.qna.context.filterByContexts') : lang.tr('module.qna.context.selectContext')
        }
        items={availableContexts}
        itemRenderer={ctxItemRenderer}
        itemPredicate={(q: string, ctx: string) => !q || ctx.includes(q)}
        onItemSelect={onItemSelect}
        tagRenderer={ctx => ctx}
        tagInputProps={{
          tagProps: { minimal: true },
          onRemove: removeCtx,
          inputProps: { id: `select-context${props.customIdSuffix ? props.customIdSuffix : ''}` }
        }}
        popoverProps={{ minimal: true, fill: true, usePortal: false }}
        selectedItems={contexts}
        createNewItemRenderer={!props.isSearch && createNewItemRenderer}
        createNewItemFromQuery={q => q}
      />
    </div>
  )
}

export default ContextSelector
