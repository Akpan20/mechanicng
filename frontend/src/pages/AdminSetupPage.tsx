import React, { useState } from 'react'
import { signInWithAdmin } from '@/lib/api/auth'
import { useNavigate } from 'react-router-dom'

export default function AdminSetupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [adminSecret, setAdminSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await signInWithAdmin(email, password, fullName, adminSecret)
      navigate('/admin')
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Initial Admin Setup</h1>
      <p className="mb-4">Create the first admin account. This is only allowed when no admin exists.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">Full name</label>
          <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Admin secret</label>
          <input className="input" value={adminSecret} onChange={e => setAdminSecret(e.target.value)} required />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="btn-primary" type="submit">Create Admin</button>
        </div>
      </form>
    </div>
  )
}
