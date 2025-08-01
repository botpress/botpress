export default ({
  pageTitle,
  helpText,
  formSubmitUrl,
  formFieldName,
  options,
  extraHiddenParams,
}: {
  pageTitle: string
  helpText: string
  formSubmitUrl: URL
  formFieldName: string
  options: { label: string; value: string }[]
  extraHiddenParams: Record<string, string>
}) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: 500 }}>
        <h1 className="text-center">{pageTitle}</h1>
        <form action={formSubmitUrl.href} method="GET">
          {Object.entries(extraHiddenParams).map(([key, value]) => (
            <input type="hidden" name={key} value={value} />
          ))}
          <div className="form-group mb-3">
            <label htmlFor={formFieldName}>{helpText}</label>
            <div className="mt-1">
              {options.map((option) => (
                <div key={option.value} className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={option.value}
                    name={formFieldName}
                    value={option.value}
                  ></input>
                  <label className="form-check-label" htmlFor={option.value}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100 d-block">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
