import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

/**
 * Wrapper for form inputs that adds label, error state, success state, and hint text.
 * Works with any <input>, <select>, or <textarea>.
 */
export default function FormField({
  label,
  htmlFor,
  error,
  success,
  hint,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[#1a1a1a]"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        {children}

        {/* Validation icon */}
        {error && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <AlertCircle size={15} className="text-red-500" />
          </div>
        )}
        {success && !error && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <CheckCircle size={15} className="text-green-500" />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          {error}
        </p>
      )}

      {/* Success */}
      {success && !error && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          {success}
        </p>
      )}

      {/* Hint */}
      {hint && !error && !success && (
        <p className="text-xs text-[#8a7968]">{hint}</p>
      )}
    </div>
  )
}
