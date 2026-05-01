import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  placeholder?: string
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      wrapperClassName,
      className,
      id,
      children,
      ...props
    },
    ref
  ) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={clsx(
              'block w-full px-3.5 py-2.5 rounded-lg text-sm text-charcoal',
              'bg-white border appearance-none transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-charcoal-50',
              'pr-10',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-charcoal-200 hover:border-charcoal-300',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          {/* Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="w-4 h-4 text-charcoal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
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

Select.displayName = 'Select'

export default Select
