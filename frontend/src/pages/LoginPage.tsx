import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { setUser, setProfile } from '@/store/authSlice'
import { z } from 'zod'
import { signIn } from '@/lib/api/auth'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate  = useNavigate()
  const dispatch  = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { user } = await signIn(data.email, data.password)
      dispatch(setUser({ id: user.id, email: user.email }))
      dispatch(setProfile(user))
      toast.success('Welcome back!')
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin')
      else navigate('/dashboard')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Sign In – MechanicNG</title></Helmet>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-3xl font-extrabold mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your MechanicNG account</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card p-7 space-y-5">
          <div>
            <label className="section-title block mb-2">Email Address</label>
            <input className="input" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="section-title block mb-2">Password</label>
            <input className="input" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-500 hover:underline">Create one free</Link>
          </p>
          <p className="text-center text-xs text-gray-600">
            First time setup?{' '}
            <Link to="/admin/setup" className="text-gray-500 hover:underline">Create admin account</Link>
          </p>
        </form>
      </div>
    </>
  )
}