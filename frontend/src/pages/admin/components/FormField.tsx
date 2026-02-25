import React from 'react'

interface FormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
}

export function FormField({ label, children, error }: FormFieldProps) {
  return (
    <div>
      <label className="section-title block mb-2">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">⚠ {error}</p>}
    </div>
  )
}