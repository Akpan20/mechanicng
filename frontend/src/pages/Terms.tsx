export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2">Terms & Conditions</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using MechanicNG, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. Platform Use</h2>
          <p>MechanicNG is a directory platform connecting vehicle owners with mechanics in Nigeria. We do not employ mechanics and are not responsible for the quality of services rendered by listed mechanics.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Mechanic Listings</h2>
          <p>Mechanics are responsible for the accuracy of their listing information. MechanicNG reserves the right to suspend or remove any listing that violates our policies or receives consistent negative feedback.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Payments & Subscriptions</h2>
          <p>Subscription payments are processed securely via Paystack. All fees are non-refundable unless otherwise stated. MechanicNG reserves the right to change pricing with 30 days' notice.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">5. Limitation of Liability</h2>
          <p>MechanicNG is not liable for any damages arising from your use of the platform, including disputes between drivers and mechanics. Use the platform at your own risk.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">6. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the platform after changes constitutes your acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">7. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:hello@mechanicng.com" className="text-brand-500 hover:underline">hello@mechanicng.onrender.com</a>.</p>
        </section>
      </div>
    </div>
  )
}