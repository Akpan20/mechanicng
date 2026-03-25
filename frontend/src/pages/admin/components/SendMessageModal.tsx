// src/pages/admin/components/SendMessageModal.tsx
import { useState } from 'react'
import toast from 'react-hot-toast'
import { adminSendNotification } from '@/lib/api/notifications'
import type { SendTarget, NotifType } from '@/lib/api/notifications'

interface Props {
  onClose: () => void
}

const TYPE_OPTIONS: { value: NotifType; label: string; color: string }[] = [
  { value: 'info',    label: 'ℹ️ Info',    color: 'text-blue-400'   },
  { value: 'success', label: '✅ Success', color: 'text-emerald-400' },
  { value: 'warning', label: '⚠️ Warning', color: 'text-amber-400'  },
  { value: 'error',   label: '🚨 Error',   color: 'text-red-400'    },
]

export default function SendMessageModal({ onClose }: Props) {
  const [target,  setTarget]  = useState<SendTarget>('all')
  const [role,    setRole]    = useState<'user' | 'mechanic'>('user')
  const [userId,  setUserId]  = useState('')
  const [type,    setType]    = useState<NotifType>('info')
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [link,    setLink]    = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    if (target === 'user' && !userId.trim()) {
      toast.error('Please enter a User ID')
      return
    }

    setLoading(true)
    try {
      const result = await adminSendNotification({
        target,
        type,
        title:   title.trim(),
        message: message.trim(),
        link:    link.trim() || undefined,
        ...(target === 'role' ? { role }           : {}),
        ...(target === 'user' ? { userId: userId.trim() } : {}),
      })
      toast.success(`✅ Message sent to ${result.sent} user${result.sent !== 1 ? 's' : ''}`)
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <p className="section-title mb-0.5">Admin</p>
            <h2 className="text-xl font-extrabold">Send Message</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-800 border border-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Target */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Send To
            </label>
            <div className="flex gap-2">
              {([
                { value: 'all',  label: '🌍 All Users'  },
                { value: 'role', label: '👥 By Role'    },
                { value: 'user', label: '👤 One User'   },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    target === opt.value
                      ? 'bg-brand-500/15 border-brand-500 text-brand-500'
                      : 'bg-surface-800 border-gray-700 text-gray-400 hover:text-white'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role picker */}
          {target === 'role' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Role
              </label>
              <div className="flex gap-2">
                {(['user', 'mechanic'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                      role === r
                        ? 'bg-brand-500/15 border-brand-500 text-brand-500'
                        : 'bg-surface-800 border-gray-700 text-gray-400 hover:text-white'
                    }`}>
                    {r === 'user' ? '🚗 Drivers' : '🔧 Mechanics'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User ID input */}
          {target === 'user' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                User ID (MongoDB ObjectId)
              </label>
              <input
                className="input text-sm"
                placeholder="e.g. 64a1f2b3c4d5e6f7a8b9c0d1"
                value={userId}
                onChange={e => setUserId(e.target.value)}
              />
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Message Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    type === opt.value
                      ? 'bg-brand-500/15 border-brand-500 text-brand-500'
                      : 'bg-surface-800 border-gray-700 text-gray-400 hover:text-white'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Title
            </label>
            <input
              className="input text-sm"
              placeholder="e.g. Platform Update"
              maxLength={80}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Message
            </label>
            <textarea
              className="input text-sm resize-none"
              rows={4}
              placeholder="Write your message here..."
              maxLength={500}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{message.length}/500</p>
          </div>

          {/* Link (optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Link <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <input
              className="input text-sm"
              placeholder="e.g. /pricing or https://..."
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1 py-3">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="loader w-4 h-4 border-2 border-white/30 border-t-white" />Sending…</>
            ) : (
              '📨 Send Message'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}