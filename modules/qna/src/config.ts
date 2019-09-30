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
   * @default botpress
   */
  qnaMakerKnowledgebase?: string
  /**
   * List of categories, separated by a comma
   * @deprecated use NLU intent contexts instead, this will be removed in Botpress 13
   */
  qnaCategories?: string
}
