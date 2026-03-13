import fetch from 'node-fetch'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { note, token } = req.body || {}
  if (!note || !token) return res.status(400).json({ error: 'Missing note or captcha token' })

  // 1) Verify reCAPTCHA
  const params = new URLSearchParams()
  params.append('secret', process.env.RECAPTCHA_SECRET)
  params.append('response', token)

  try {
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params,
    })
    const verifyJson = await verifyRes.json()

    if (!verifyJson.success || (verifyJson.score && verifyJson.score < 0.3)) {
      // If using v3, check score threshold. If v2, 'score' won't be present.
      return res.status(403).json({ error: 'Failed captcha verification' })
    }

    // 2) Forward the note to a webhook (Discord example)
    const webhook = process.env.DISCORD_WEBHOOK_URL
    if (!webhook) return res.status(500).json({ error: 'Webhook not configured' })

    const payload = {
      content: `New note from Cine-Lab site:\n\n${note}`,
    }

    const hookRes = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!hookRes.ok) {
      const text = await hookRes.text()
      console.error('Webhook error:', text)
      return res.status(500).json({ error: 'Failed to deliver note to webhook' })
    }

    return res.status(200).json({ message: 'Note delivered. Thank you!' })
  } catch (err) {
    console.error('leave-note error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
