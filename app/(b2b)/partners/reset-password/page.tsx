import { ResetPasswordClient } from './ResetPasswordClient'

export const metadata = {
  title: 'Set password — Dorst Partner Portal',
  robots: { index: false, follow: false },
  // The token is in the URL fragment (never sent to servers); keep the page itself from leaking it.
  referrer: 'no-referrer',
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
