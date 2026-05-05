import MarkdownDiv from '../markdown-div'

export default ({
  pageTitle,
  helpText,
  buttons,
}: {
  pageTitle: string
  helpText: string
  buttons: ({
    label: string
    type?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info'
  } & ({ navigateTo: URL } | { closeWindow: true }))[]
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ maxWidth: 500, width: '100%' }}>
        <h1 className="text-center">{pageTitle}</h1>
        <MarkdownDiv>{helpText}</MarkdownDiv>
        <div style={{ columnGap: 5, display: 'flex', justifyContent: 'center' }}>
          {buttons.map((button) =>
            'navigateTo' in button ? (
              <a key={button.label} href={button.navigateTo.href} className={`btn btn-${button.type ?? 'primary'}`}>
                {button.label}
              </a>
            ) : (
              <a
                key={button.label}
                href="javascript:void(0);"
                // @ts-ignore
                // To allow interaction, not supported on SSR, use html attribute
                onclick="window.close()"
                className={`btn btn-${button.type ?? 'primary'}`}
              >
                {button.label}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  )
}
