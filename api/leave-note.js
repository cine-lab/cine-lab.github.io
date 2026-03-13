export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { note } = req.body;
  
    if (!note) return res.status(400).json({ error: 'Missing note' });
  
    try {
      // Example: post to Discord webhook
      const webhook = process.env.DISCORD_WEBHOOK_URL;
      if (!webhook) return res.status(500).json({ error: 'Webhook not configured' });
  
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `New note: ${note}` })
      });
  
      res.status(200).json({ message: 'Note sent successfully!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
  