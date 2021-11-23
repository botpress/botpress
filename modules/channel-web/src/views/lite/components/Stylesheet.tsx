import React from 'react'

export default ({ href, onLoad }: { href: string; onLoad?: () => void }) => (
  <link rel="stylesheet" type="text/css" href={href} onLoad={onLoad} />
)
