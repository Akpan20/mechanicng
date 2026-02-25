export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-red-500 flex items-center justify-center text-3xl mx-auto mb-4">🔧</div>
        <h1 className="text-3xl font-extrabold mb-3">About MechanicNG</h1>
        <p className="text-gray-400 text-lg">Nigeria's trusted mechanic directory. Find. Fix. Move.</p>
      </div>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">Our Mission</h2>
          <p>MechanicNG was built to solve a very Nigerian problem — finding a reliable mechanic when you need one most. Whether your car breaks down on the Lagos-Ibadan Expressway or you need a trusted workshop in Abuja, we connect you with verified mechanics near you.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">For Drivers</h2>
          <p>Browse hundreds of mechanics across Nigeria filtered by city, service type, and rating. Read real reviews from other drivers and get quotes directly from mechanics before committing.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">For Mechanics</h2>
          <p>MechanicNG gives mechanics and auto workshops a professional online presence. List your services, receive quote requests, and grow your customer base — all from one dashboard.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">Built for Nigerian Roads</h2>
          <p>We understand the realities of motoring in Nigeria — from fuel scarcity to road conditions. MechanicNG is designed with the Nigerian driver and mechanic in mind, with mobile-first interfaces and local payment options via Paystack.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">Get in Touch</h2>
          <p>We'd love to hear from you. Reach us at <a href="mailto:hello@mechanicng.com" className="text-brand-500 hover:underline">hello@mechanicng.com</a> or call <span className="text-white">+234 800 MECHANIC</span>.</p>
        </section>
      </div>
    </div>
  )
}