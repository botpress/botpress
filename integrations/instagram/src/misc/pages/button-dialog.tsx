export default ({
  description,
  buttons = [],
}: {
  description: string
  buttons: {
    display: string
    type: 'primary' | 'secondary'
    action: 'NAVIGATE' | 'CLOSE_WINDOW'
    payload?: any
  }[]
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <p>{description}</p>
        <div style={{ columnGap: 5, display: 'flex', justifyContent: 'center' }}>
          {buttons.map((button) => {
            switch (button.action) {
              case 'NAVIGATE':
                return (
                  <a key={button.display} href={button.payload} className={`btn btn-${button.type}`}>
                    {button.display}
                  </a>
                )
              case 'CLOSE_WINDOW':
                return (
                  <a
                    key={button.display}
                    href="javascript:void(0);"
                    // @ts-ignore
                    // To allow interaction, not supported on SSR, use html attribute
                    onclick="window.close()"
                    className={`btn btn-${button.type}`}
                  >
                    {button.display}
                  </a>
                )
              default:
                return ''
            }
          })}
        </div>
      </div>
    </div>
  )
}
