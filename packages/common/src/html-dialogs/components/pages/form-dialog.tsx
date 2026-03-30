import type { FormFieldDescriptor } from '../../../oauth-wizard/schema-to-fields'
import MarkdownDiv from '../markdown-div'

const FormField = ({ field, paramPrefix }: { field: FormFieldDescriptor; paramPrefix: string }) => {
  const fieldName = `${paramPrefix}${field.name}`
  const value = field.previousValue ?? field.defaultValue

  if (field.inputType === 'checkbox') {
    return (
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id={fieldName}
          name={fieldName}
          value="true"
          checked={value === 'true'}
          disabled={field.disabled}
        />
        <label className="form-check-label" htmlFor={fieldName}>
          {field.label}
        </label>
        {field.description && <div className="form-text">{field.description}</div>}
        {field.error && <div className="text-danger small mt-1">{field.error}</div>}
      </div>
    )
  }

  if (field.inputType === 'select') {
    return (
      <div className="form-group mb-3">
        <label htmlFor={fieldName} className="form-label">
          {field.label}
        </label>
        <select
          className={`form-select${field.error ? ' is-invalid' : ''}`}
          id={fieldName}
          name={fieldName}
          required={field.required}
          disabled={field.disabled}
        >
          <option value="">{field.placeholder ?? 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value} selected={value === opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.description && <div className="form-text">{field.description}</div>}
        {field.error && <div className="invalid-feedback">{field.error}</div>}
      </div>
    )
  }

  return (
    <div className="form-group mb-3">
      <label htmlFor={fieldName} className="form-label">
        {field.label}
      </label>
      <input
        type={field.inputType}
        className={`form-control${field.error ? ' is-invalid' : ''}`}
        id={fieldName}
        name={fieldName}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        value={value}
      />
      {field.description && <div className="form-text">{field.description}</div>}
      {field.error && <div className="invalid-feedback">{field.error}</div>}
    </div>
  )
}

export default ({
  pageTitle,
  helpText,
  formSubmitUrl,
  formParamPrefix,
  fields,
  extraHiddenParams,
}: {
  pageTitle: string
  helpText: string
  formSubmitUrl: URL
  formParamPrefix: string
  fields: FormFieldDescriptor[]
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
          <MarkdownDiv>{helpText}</MarkdownDiv>
          {fields
            .filter((f) => !f.hidden)
            .map((field) => (
              <FormField key={field.name} field={field} paramPrefix={formParamPrefix} />
            ))}
          <button type="submit" className="btn btn-primary w-100 d-block">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
