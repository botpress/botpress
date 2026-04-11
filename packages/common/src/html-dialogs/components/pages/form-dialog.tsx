import type { FormFieldDescriptor } from '../../../oauth-wizard/schema-to-fields'
import MarkdownDiv from '../markdown-div'

type FieldProps = { field: FormFieldDescriptor; fieldName: string; value?: string }

const FieldDescription = ({ description }: { description?: string }) =>
  description ? <div className="form-text">{description}</div> : null

const FieldError = ({ error, inline }: { error?: string; inline?: boolean }) =>
  error ? <div className={inline ? 'text-danger small mt-1' : 'invalid-feedback'}>{error}</div> : null

const BooleanField = ({ field, fieldName, value }: FieldProps) => {
  return (
    <div className="form-check mb-3">
      <input
        type="checkbox"
        className="form-check-input"
        id={fieldName}
        name={fieldName}
        value="true"
        checked={value === 'true'}
        required={field.required}
        disabled={field.disabled}
      />
      <label className="form-check-label" htmlFor={fieldName}>
        {field.label}
      </label>
      <FieldDescription description={field.description} />
      <FieldError error={field.error} inline />
    </div>
  )
}

const EnumField = ({ field, fieldName, value }: FieldProps) => {
  const p = field.displayAsParams
  const options = field.options ?? []

  if (field.inputType === 'radio') {
    return (
      <div className="form-group mb-3">
        <label className="form-label">{field.label}</label>
        {options.map((opt) => (
          <div key={opt.value} className="form-check">
            <input
              type="radio"
              className="form-check-input"
              id={`${fieldName}-${opt.value}`}
              name={fieldName}
              value={opt.value}
              checked={value === opt.value}
              required={field.required}
              disabled={field.disabled}
            />
            <label className="form-check-label" htmlFor={`${fieldName}-${opt.value}`}>
              {opt.label}
            </label>
          </div>
        ))}
        <FieldDescription description={field.description} />
        <FieldError error={field.error} inline />
      </div>
    )
  }

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
        multiple={p.multiple as boolean | undefined}
        size={p.size as number | undefined}
      >
        <option value="">{field.placeholder ?? 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} selected={value === opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldDescription description={field.description} />
      <FieldError error={field.error} />
    </div>
  )
}

const TextField = ({ field, fieldName, value }: FieldProps) => {
  const p = field.displayAsParams
  return (
    <div className="form-group mb-3">
      <label htmlFor={fieldName} className="form-label">
        {field.label}
      </label>
      <textarea
        className={`form-control${field.error ? ' is-invalid' : ''}`}
        id={fieldName}
        name={fieldName}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        rows={p.rows as number | undefined}
        cols={p.cols as number | undefined}
        maxLength={p.maxLength as number | undefined}
      >
        {value}
      </textarea>
      <FieldDescription description={field.description} />
      <FieldError error={field.error} />
    </div>
  )
}

const StringField = ({ field, fieldName, value }: FieldProps) => {
  const p = field.displayAsParams
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
        min={p.min as string | number | undefined}
        max={p.max as string | number | undefined}
        step={(p.step ?? p.stepSize) as string | number | undefined}
        pattern={p.pattern as string | undefined}
        minLength={p.minLength as number | undefined}
        maxLength={p.maxLength as number | undefined}
      />
      <FieldDescription description={field.description} />
      <FieldError error={field.error} />
    </div>
  )
}

const FormField = ({ field, paramPrefix }: { field: FormFieldDescriptor; paramPrefix: string }) => {
  const fieldName = `${paramPrefix}${field.name}`
  const value = field.previousValue ?? field.defaultValue

  switch (field.inputType) {
    case 'checkbox':
      return <BooleanField field={field} fieldName={fieldName} value={value} />
    case 'radio':
    case 'select':
      return <EnumField field={field} fieldName={fieldName} value={value} />
    case 'textarea':
      return <TextField field={field} fieldName={fieldName} value={value} />
    default:
      return <StringField field={field} fieldName={fieldName} value={value} />
  }
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
    <div className="d-flex justify-content-center align-items-center vh-100 overflow-hidden">
      <div className="d-flex flex-column w-100 py-4 mh-100" style={{ maxWidth: 500 }}>
        <div className="flex-shrink-0">
          <h1 className="text-center">{pageTitle}</h1>
          <MarkdownDiv>{helpText}</MarkdownDiv>
        </div>
        <form
          className="flex-grow-1 px-1 overflow-auto"
          id="wizard-form"
          action={formSubmitUrl.href}
          method="POST"
          style={{ minHeight: 0 }}
        >
          {Object.entries(extraHiddenParams).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
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
