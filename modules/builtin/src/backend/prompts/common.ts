import { FormField } from 'botpress/sdk'

const commonFields = (defaultDuration: number = 5, defaultSearchBackCount: number = 0): FormField[] => {
  return [
    {
      type: 'text',
      key: 'duration',
      label: 'module.builtin.duration'
    },
    {
      type: 'text',
      key: 'searchBackCount',
      label: 'module.builtin.searchBackCount'
    }
  ]
}

export default commonFields
