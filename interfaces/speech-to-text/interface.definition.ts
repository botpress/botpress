/* bplint-disable */
import * as common from '@botpress/common'
import { z, InterfaceDeclaration } from '@botpress/sdk'

export default new InterfaceDeclaration({
  name: 'speechToText',
  version: '2.0.0',
  entities: {
    speechToTextModelRef: {
      schema: common.speechToText.schemas.SpeechModelRefSchema,
    },
  },
  actions: {
    transcribeAudio: {
      billable: true,
      cacheable: true,
      input: {
        schema: ({ speechToTextModelRef }) =>
          common.speechToText.schemas.TranscribeAudioInputSchema(speechToTextModelRef),
      },
      output: {
        schema: () => common.speechToText.schemas.TranscribeAudioOutputSchema,
      },
    },
    listSpeechToTextModels: {
      input: {
        schema: () => z.object({}),
      },
      output: {
        schema: ({ speechToTextModelRef }) =>
          z.object({
            models: z.array(z.intersection(common.speechToText.schemas.SpeechToTextModelSchema, speechToTextModelRef)),
          }),
      },
    },
  },
})
