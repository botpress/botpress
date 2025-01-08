import { z } from '@botpress/sdk'
import { ActionArgs } from './types'

type ConfigFieldProps<Z extends z.ZodTypeAny> = {
  name: string
  schema: Z
  default: z.infer<Z>
}

class ConfigField<Z extends z.ZodTypeAny> {
  public constructor(private _props: ConfigFieldProps<Z>) {}
  public safeParse(args: ActionArgs, value: unknown): z.infer<Z> {
    const { default: defaultValue, name, schema } = this._props
    const parseResult = schema.safeParse(value)
    if (parseResult.success) {
      return parseResult.data
    }
    args.logger
      .forBot()
      .warn(`Invalid value for action input "${name}": "${value}". Falling back on default value: "${defaultValue}".`)
    return defaultValue
  }
}

export const sizeConfig = new ConfigField({
  name: 'size',
  schema: z.union([z.literal('1024x1024'), z.literal('1792x1024'), z.literal('1024x1792')]),
  default: '1024x1024',
})

export const qualityConfig = new ConfigField({
  name: 'quality',
  schema: z.union([z.literal('standard'), z.literal('hd')]),
  default: 'standard',
})

export const modelConfig = new ConfigField({
  name: 'model',
  schema: z.literal('dall-e-3'),
  default: 'dall-e-3',
})
