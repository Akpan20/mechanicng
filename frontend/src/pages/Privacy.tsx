// src/pages/Privacy.tsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectUser } from '@/store/authSlice'

export default function PrivacyPage() {
  const navigate = useNavigate()
  const user     = useAppSelector(selectUser)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)

  const handleDeletionRequest = async () => {
    setLoading(true)
    try {
      // Send deletion request email — or call a backend endpoint
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/request-deletion`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      setSubmitted(true)
    } catch {
      // Fallback — open email client
      window.location.href = `mailto:hello@mechanicng.com?subject=Data Deletion Request&body=Please delete all data associated with my account (${user?.email}).`
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors group">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        Back
      </button>

      <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

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
          <p>Your data is stored securely on MongoDB Atlas infrastructure hosted on AWS. We implement industry-standard security measures including encryption at rest and in transit to protect your information from unauthorized access.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Cookies</h2>
          <p>We use cookies to maintain your session and remember your preferences. See our <a href="/cookies" className="text-brand-500 hover:underline">Cookie Policy</a> for details and to manage your preferences.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">5. Third-Party Services</h2>
          <p>We use Paystack for payment processing, MongoDB Atlas for data storage, Cloudinary for image hosting, and Resend for transactional emails. These services have their own privacy policies governing your data.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">6. Nigerian Data Protection</h2>
          <p>We comply with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act 2023. As a Nigerian platform serving Nigerian users, your data rights under these laws are fully respected.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">7. Your Rights</h2>
          <p className="mb-4">Under NDPR and GDPR you have the right to access, correct, export, or delete your personal data at any time. You can:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400 text-sm mb-4">
            <li>Update your profile information from your Dashboard</li>
            <li>Request a copy of your data by emailing us</li>
            <li>Request complete deletion of your account and all associated data</li>
          </ul>

          {/* Data deletion request */}
          <div className="card p-5 border-red-500/20">
            <p className="font-semibold text-white mb-1">Request Account Deletion</p>
            <p className="text-sm text-gray-400 mb-4">
              This will permanently delete your account, mechanic listing, reviews, and all
              associated data. This action cannot be undone. We will process your request
              within 30 days as required by law.
            </p>
            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">
                ✓ Deletion request received. We will process it within 30 days and confirm by email.
              </div>
            ) : user ? (
              <button
                onClick={handleDeletionRequest}
                disabled={loading}
                className="px-4 py-2 bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                {loading ? 'Sending request...' : '🗑 Request Data Deletion'}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                <a href="/login" className="text-brand-500 hover:underline">Sign in</a> to request deletion, or email us directly at{' '}
                <a href="mailto:hello@mechanicng.com" className="text-brand-500 hover:underline">hello@mechanicng.com</a>.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">8. Changes to This Policy</h2>
          <p>We may update this policy periodically. We will notify registered users of significant changes via email.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">9. Contact</h2>
          <p>Privacy questions or concerns? Contact our Data Protection Officer at <a href="mailto:hello@mechanicng.com" className="text-brand-500 hover:underline">hello@mechanicng.com</a>.</p>
        </section>
      </div>
    </div>
  )
}