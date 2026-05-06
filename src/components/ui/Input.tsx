import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-charcoal-700"
          >
            {label}
            {props.required && (
              <span className="text-terracotta ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full px-3.5 py-2.5 rounded-lg text-sm text-charcoal',
            'bg-white border transition-all duration-150',
            'placeholder:text-charcoal-300',
            'focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-charcoal-50',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-charcoal-200 hover:border-charcoal-300',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-charcoal-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ─── Textarea variant ─────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  wrapperClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-charcoal-700">
            {label}
            {props.required && (
              <span className="text-terracotta ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full px-3.5 py-2.5 rounded-lg text-sm text-charcoal',
            'bg-white border transition-all duration-150 resize-y min-h-[100px]',
            'placeholder:text-charcoal-300',
            'focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-charcoal-50',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-charcoal-200 hover:border-charcoal-300',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-charcoal-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Input
