export default ({
  pageTitle,
  helpText,
  formSubmitUrl,
  formFieldName,
  options,
}: {
  pageTitle: string
  helpText: string
  formSubmitUrl: URL
  formFieldName: string
  options: { label: string; value: string }[]
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <h1 className="text-center">{pageTitle}</h1>
        <form action={formSubmitUrl.href} method="GET">
          <div className="form-group">
            <label htmlFor={formFieldName}>{helpText}</label>
            <div>
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
          <button type="submit" className="btn btn-primary btn-block">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
