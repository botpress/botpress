export interface Config {
  /**
   * @default ./qna
   */
  qnaDir: string
  /**
   * @default #builtin_text
   */
  textRenderer: string
  /**
   * @default utf8
   */
  exportCsvEncoding: string
  qnaMakerApiKey?: string
  /**
   * @default botpress
   */
  qnaMakerKnowledgebase?: string
  /**
   * List of categories, separated by a comma
   * @default global
   */
  qnaCategories?: string
}
