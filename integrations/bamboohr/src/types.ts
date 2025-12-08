import * as bp from '.botpress'

export type CommonHandlerProps = Pick<bp.HandlerProps, 'ctx' | 'client' | 'logger'>
