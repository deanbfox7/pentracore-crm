export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-white mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-6">Configure your API integrations and preferences</p>

      <div className="space-y-4">
        {[
          { title: 'SendGrid (Email)', desc: 'Set SENDGRID_API_KEY, SENDGRID_FROM_EMAIL in your Vercel environment variables', status: 'Configure in Vercel', color: 'text-yellow-400' },
          { title: 'Twilio (SMS)', desc: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in Vercel', status: 'Configure in Vercel', color: 'text-yellow-400' },
          { title: 'OpenAI (AI Scoring & Personalization)', desc: 'Set OPENAI_API_KEY in your Vercel environment variables', status: 'Configure in Vercel', color: 'text-yellow-400' },
          { title: 'Supabase (Database)', desc: 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY', status: 'Configure in Vercel', color: 'text-yellow-400' },
        ].map(({ title, desc, status, color }) => (
          <div key={title} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
            </div>
            <span className={`text-xs shrink-0 ${color}`}>{status}</span>
          </div>
        ))}

        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-indigo-300 text-sm font-medium mb-2">Cron Jobs (Vercel)</p>
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <p>Every 5 min: /api/cron/process-sequences → sends due campaign emails/SMS</p>
            <p>Every hour: /api/cron/send-reminders → sends appointment reminders</p>
            <p>2 AM daily: /api/cron/score-new-leads → AI scores new leads</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <p className="text-white font-medium text-sm mb-2">Booking Link</p>
          <p className="text-slate-500 text-xs">Share this link with prospects so they can book meetings with you:</p>
          <p className="text-indigo-400 text-sm font-mono mt-2">{typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/book/dean</p>
        </div>
      </div>
    </div>
  )
}
