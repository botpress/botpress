import { z } from '@botpress/sdk'
import { MessageHandlerProps } from './types'
import { ApiUtils } from './utils'

const valuesSchema = z.array(z.array(z.union([z.string(), z.number()])))

export class CommandError extends Error {}
export type Command = (props: MessageHandlerProps, args: string[]) => Promise<void>

const help: Command = async (props) => {
  const utils = new ApiUtils(props)
  const commandNames = Object.keys(commands)
  await utils.respond(`Available commands\n${commandNames.map((name) => `- ${name}`).join('\n')}`)
}

const info: Command = async (props) => {
  const utils = new ApiUtils(props)
  const { output } = await props.client.callAction({
    type: 'gsheets:getInfoSpreadsheet',
    input: {
      fields: [
        'sheets.properties.sheetId',
        'sheets.properties.title',
        'sheets.properties.gridProperties.rowCount',
        'sheets.properties.gridProperties.columnCount',
      ],
    },
  })
  await utils.respond(JSON.stringify(output, null, 2))
}

const get: Command = async (props, args) => {
  const utils = new ApiUtils(props)

  const [range] = args
  if (!range) {
    throw new CommandError('Missing range')
  }

  const {
    output: { values },
  } = await props.client.callAction({
    type: 'gsheets:getValues',
    input: {
      range,
    },
  })

  await utils.respond(JSON.stringify(values, null, 2))
}

const set: Command = async (props, args) => {
  const utils = new ApiUtils(props)

  const [range, ...body] = args
  const jsonValues = body.join(' ')

  if (!range) {
    throw new CommandError('Missing range')
  }

  const parseResult = valuesSchema.safeParse(JSON.parse(jsonValues))
  if (!parseResult.success) {
    throw new CommandError('Invalid values')
  }

  const values = parseResult.data

  await props.client.callAction({
    type: 'gsheets:updateValues',
    input: {
      range,
      values: _stringifyValues(values),
    },
  })

  await utils.respond('Done')
}

const append: Command = async (props, args) => {
  const utils = new ApiUtils(props)

  const [range, ...body] = args
  const jsonValues = body.join(' ')

  if (!range) {
    throw new CommandError('Missing range')
  }

  const parseResult = valuesSchema.safeParse(JSON.parse(jsonValues))
  if (!parseResult.success) {
    throw new CommandError('Invalid values')
  }

  const values = parseResult.data

  await props.client.callAction({
    type: 'gsheets:appendValues',
    input: {
      range,
      values: _stringifyValues(values),
    },
  })

  await utils.respond('Done')
}

const clear: Command = async (props, args) => {
  const utils = new ApiUtils(props)
  const [range] = args
  if (!range) {
    throw new CommandError('Missing range')
  }

  await props.client.callAction({
    type: 'gsheets:clearValues',
    input: {
      range,
    },
  })

  await utils.respond('Done')
}

const addSheet: Command = async (props, args) => {
  const utils = new ApiUtils(props)

  const [title] = args

  if (!title) {
    throw new CommandError('Missing title')
  }

  await props.client.callAction({
    type: 'gsheets:addSheet',
    input: {
      title,
    },
  })

  await utils.respond('Done')
}

const _stringifyValues = (values: any[][]): string[][] =>
  values.map((majorDimension) => majorDimension.map((cell) => cell.toString()))

export const commands = {
  '/help': help,
  '/info': info,
  '/get': get,
  '/set': set,
  '/append': append,
  '/clear': clear,
  '/addSheet': addSheet,
} satisfies Record<`/${string}`, Command>
