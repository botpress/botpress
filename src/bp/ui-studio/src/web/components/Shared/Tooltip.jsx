import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const style = {
  fontSize: '14px',
  verticalAlign: 'middle',
  opacity: '0.75'
}

export const BotpressTooltip = props => (
  <OverlayTrigger
    placement={props.placement || 'right'}
    overlay={<Tooltip id={`tooltip-${props.placement || 'right'}`}>{props.message}</Tooltip>}
  >
    <i className="material-icons" style={style}>
      info_outline
    </i>
  </OverlayTrigger>
)
