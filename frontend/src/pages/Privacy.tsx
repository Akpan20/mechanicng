export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, phone number, and business details when you create an account or mechanic listing. We also collect usage data such as pages visited and search queries to improve our service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Information</h2>
          <p>Your information is used to operate the platform, process payments, send service-related communications, and improve user experience. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Data Storage</h2>
          <p>Your data is stored securely on Supabase infrastructure. We implement industry-standard security measures to protect your information from unauthorized access.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Cookies</h2>
          <p>We use cookies to maintain your session and remember your preferences. See our <a href="/cookies" className="text-brand-500 hover:underline">Cookie Policy</a> for details.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">5. Third-Party Services</h2>
          <p>We use Paystack for payment processing and Supabase for data storage. These services have their own privacy policies governing your data.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:hello@mechanicng.com" className="text-brand-500 hover:underline">hello@mechanicng.onrender.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">7. Changes to This Policy</h2>
          <p>We may update this policy periodically. We will notify registered users of significant changes via email.</p>
        </section>
      </div>
    </div>
  )
}