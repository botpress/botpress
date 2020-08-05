import { Button } from '@blueprintjs/core'
import { useState } from 'react'
import api from '~/api'
import { toastFailure } from '~/utils/toaster'

export const DiagReport = () => {
  const [busy, setBusy] = useState(false)

  const getDiagReport = async () => {
    setBusy(true)

    try {
      const { data } = await api.getSecured().get('/admin/server/diag')

      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([data]))
      link.download = `diagnostic.txt`
      link.click()
    } catch (err) {
      toastFailure(`Couldn't generate diagnostic report: ${err}`)
    } finally {
      setBusy(false)
    }
  }

  return <Button onClick={getDiagReport} text={busy ? 'Please wait...' : 'Generate report'} disabled={busy}></Button>
}
