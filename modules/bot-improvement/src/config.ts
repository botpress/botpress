export interface Config {
  /**
   * @default false
   */
  paused: boolean
  /**
   * @default 3 days
   */
  sessionExpiry: string
  /**
   * @default [{"label": "Language", "attributePath": "language"}]
   */
  attributes: Attribute[]
}

export interface Attribute {
  /**
   * The label displayed next to the value
   */
  label: string
  /**
   * The path to access that value in the user's attribute. For example, if you save an attribute like
   * "profile": { "age": 18 }, you can set the path "profile.age" to access the value.
   */
  attributePath: string
  /**
   * The default value to display if the attribute is not set for the user. The value will then be displayed by the formatter.
   * Example, you could display N/A instead of an empty value
   */
  defaultValue?: string
  /**
   * The formatter to use to display the value. (none = displays the value as-is). Some options:
   *
   * - "moment:CUSTOM_FORMAT": Display the date in the format specified after moment:, ex: moment:MMMM Do YYYY, h:mm a
   * - "date": Display the current date in format YYYY-MM-DD
   * - "datetime": Display the date in format YYYY-MM-DD HH:mm:ss
   * - "fromNow": Display the difference between now and the date (ex: 18 hours ago)
   */
  formatter?: string
}
