import MarkdownDiv from '../markdown-div'

export default ({
  pageTitle,
  helpText,
  formSubmitUrl,
  formFieldName,
  inputConfig,
  extraHiddenParams,
}: {
  pageTitle: string
  helpText: string
  formSubmitUrl: URL
  formFieldName: string
  inputConfig: {
    label: string
    type: 'text' | 'number' | 'email' | 'password' | 'url'
  }
  extraHiddenParams: Record<string, string>
}) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: 500 }}>
        <h1 className="text-center">{pageTitle}</h1>
        <form action={formSubmitUrl.href} method="GET">
          {Object.entries(extraHiddenParams).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <div className="form-group mb-3">
            <MarkdownDiv>{helpText}</MarkdownDiv>
            <label htmlFor={formFieldName} className="form-label">
              {inputConfig.label}
            </label>
            <input type={inputConfig.type} className="form-control" id={formFieldName} name={formFieldName} required />
          </div>
          <button type="submit" className="btn btn-primary w-100 d-block">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
