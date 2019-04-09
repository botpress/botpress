import { OverlayTrigger, Tooltip } from 'react-bootstrap'

export const BotpressTooltip = props => (
  <OverlayTrigger
    placement={props.placement || 'right'}
    overlay={<Tooltip id={`tooltip-${props.placement || 'right'}`}>{props.message}</Tooltip>}
  >
    <i className="material-icons md-14">info</i>
  </OverlayTrigger>
)
