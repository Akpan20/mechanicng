export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2">Contact Us</h1>
      <p className="text-gray-400 mb-10">We're here to help. Reach out through any of the channels below.</p>

      <div className="grid gap-4 mb-10">
        {[
          { icon: '✉️', label: 'Email', value: 'hello@mechanicng.com', href: 'mailto:hello@mechanicng.com' },
          { icon: '📞', label: 'Phone', value: '+234 800 MECHANIC',     href: 'tel:+2348006324266'         },
        ].map(({ icon, label, value, href }) => (
          <a key={label} href={href}
            className="card p-5 flex items-center gap-4 hover:border-brand-500/50 transition-colors group">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-white font-semibold group-hover:text-brand-500 transition-colors">{value}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">Send a Message</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input className="input w-full" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input className="input w-full" type="email" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Message</label>
            <textarea className="input w-full min-h-[120px] resize-y" placeholder="How can we help?" />
          </div>
          <button className="btn-primary w-full">Send Message</button>
        </div>
      </div>
    </div>
  )
}