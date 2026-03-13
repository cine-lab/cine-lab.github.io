import React, { useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

export default function LeaveNote() {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const recaptchaRef = React.createRef()

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const token = await recaptchaRef.current.executeAsync()
      recaptchaRef.current.reset()

      const res = await fetch('/api/leave-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, token }),
      })

      const body = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: body.message || 'Note sent.' })
        setNote('')
      } else {
        setMessage({ type: 'error', text: body.error || 'Failed to send note.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-white/5 rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">Leave a note for the creator</h3>
      <p className="text-sm text-muted-foreground mb-4">No email required — we just use CAPTCHA to prevent spam.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="sr-only">Your note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            rows={5}
            placeholder="Write your note..."
            className="w-full rounded-md border px-3 py-2 bg-transparent"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 bg-gradient-to-r from-indigo-500 to-violet-500"
          >
            {loading ? 'Sending…' : 'Send note'}
          </button>

          {message && (
            <div className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-300'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* invisible reCAPTCHA - set size="invisible" and execute programmatically */}
        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
          size="invisible"
          ref={recaptchaRef}
        />
      </form>
    </div>
  )
}
