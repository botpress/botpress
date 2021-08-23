import actionButton from './action_button'
import audio from './audio'
import card from './card'
import carousel from './carousel'
import dropdown from './dropdown'
import file from './file'
import image from './image'
import location from './location'
import single_choice from './single_choice'
import text from './text'
import video from './video'

const allTypes: ContentType[] = [
  actionButton,
  audio,
  card,
  carousel,
  dropdown,
  file,
  image,
  location,
  single_choice,
  text,
  video
]

export default allTypes

export interface ContentType {
  id: string
  title: string
  group?: string
  description?: string
  /**
   * Hiding content types prevents users from adding these kind of elements via the Flow Editor.
   * They are still visible in the Content Manager, and it's still possible to use these elements by specifying
   * their name as a property "contentType" to ContentPickerWidget.
   */
  hidden?: boolean
  /**
   * The jsonSchema used to validate the form data of the Content Elements.
   */
  jsonSchema: object
  uiSchema?: object

  /**
   * Function that defines how a Content Type gets rendered on different channels.
   * This function resides in the javascript definition of the Content Type.
   *
   * @param data The data required to render the Content Elements. e.g. Text, images, button actions, etc.
   * @param channel The channel used to communicate, e.g. channel-web, messenger, twilio, etc.
   * @returns Return an array of rendered Content Elements
   */
  renderElement: (data: object, channel: string) => object[] | object
  /**
   * Function that computes the visual representation of the text.
   * This function resides in the javascript definition of the Content Type.
   */
  computePreviewText?: (formData: any) => string
}
