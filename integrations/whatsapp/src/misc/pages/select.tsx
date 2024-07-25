export default ({
  title,
  description,
  select,
  settings,
  additionalData = [],
}: {
  title: string
  description: string
  select: {
    key: string
    options: { id: string; display: string }[]
  }
  settings: { targetUrl: string }
  additionalData?: { key: string; value: string }[]
}) => {
  return (
    <div className="container">
      <div className="form-container">
        <h1 className="text-center">${title}</h1>
        <form action={settings.targetUrl} method="GET">
          {additionalData.map((data) => (
            <input type="hidden" name={data.key} value={data.value} />
          ))}
          <div className="form-group">
            <label htmlFor="${select.key}">${description}</label>
            <div>
              {select.options.map((option) => (
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={option.id}
                    name={select.key}
                    value={option.id}
                  ></input>
                  <label className="form-check-label" htmlFor={option.id}>
                    {option.display}
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
