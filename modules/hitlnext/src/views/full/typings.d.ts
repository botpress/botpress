// These are properties provided by the studio
export interface SkillProps<T> {
  initialData: T
  onDataChanged: (data: T) => void
  onValidChanged: (canSubmit: boolean) => void
  resizeBuilderWindow: (newSize: 'normal' | 'large' | 'small') => void
  contentLang: string
  defaultLanguage: string
  languages: string[]
}
