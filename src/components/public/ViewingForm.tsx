'use client'

import { useState } from 'react'
import { addDays, format, isWeekend } from 'date-fns'
import Input, { Textarea } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ViewingFormProps {
  propertyId: string
  propertyAddress: string
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

function getNextWeekdays(count: number): Date[] {
  const days: Date[] = []
  let cursor = addDays(new Date(), 1)
  while (days.length < count) {
    if (!isWeekend(cursor)) days.push(new Date(cursor))
    cursor = addDays(cursor, 1)
  }
  return days
}

interface FormFields {
  firstName: string
  lastName: string
  email: string
  phone: string
  preferredDate: string
  preferredTime: string
  notes: string
}

const INITIAL: FormFields = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredDate: '',
  preferredTime: '',
  notes: '',
}

export default function ViewingForm({ propertyId, propertyAddress }: ViewingFormProps) {
  const [form, setForm] = useState<FormFields>(INITIAL)
  const [errors, setErrors] = useState<Partial<FormFields>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const availableDays = getNextWeekdays(14)

  const dateOptions = availableDays.map((d) => ({
    value: d.toISOString().split('T')[0],
    label: format(d, 'EEEE, d MMMM'),
  }))

  const timeOptions = TIME_SLOTS.map((t) => ({ value: t, label: t }))

  const set = (field: keyof FormFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<FormFields> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Valid email is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!form.preferredDate) newErrors.preferredDate = 'Please choose a date'
    if (!form.preferredTime) newErrors.preferredTime = 'Please choose a time'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')

    try {
      const scheduledAt = new Date(`${form.preferredDate}T${form.preferredTime}:00`)

      const res = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          scheduledAt: scheduledAt.toISOString(),
          notes: form.notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong')
      }

      setStatus('success')
      setForm(INITIAL)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to book viewing')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-charcoal mb-2">Viewing request sent!</h3>
        <p className="text-sm text-charcoal-600">
          We&apos;ll confirm your viewing shortly. Check your email for details. If you need to get
          in touch sooner, call us on{' '}
          <a href="https://wa.link/gy7gtr" className="text-terracotta font-medium">
            WhatsApp us
          </a>
          .
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-terracotta underline underline-offset-2"
        >
          Book another viewing
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-charcoal-200 p-6">
      <h3 className="text-lg font-semibold text-charcoal mb-1">Book a Viewing</h3>
      <p className="text-sm text-charcoal-400 mb-5">{propertyAddress}</p>

      {status === 'error' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 mb-5 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={form.firstName}
            onChange={set('firstName')}
            error={errors.firstName}
            required
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={set('lastName')}
            error={errors.lastName}
            required
            autoComplete="family-name"
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
          autoComplete="email"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          required
          autoComplete="tel"
          helperText="We may call to confirm your viewing"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Preferred date"
            value={form.preferredDate}
            onChange={set('preferredDate')}
            error={errors.preferredDate}
            required
            options={dateOptions}
            placeholder="Choose date…"
          />
          <Select
            label="Preferred time"
            value={form.preferredTime}
            onChange={set('preferredTime')}
            error={errors.preferredTime}
            required
            options={timeOptions}
            placeholder="Choose time…"
          />
        </div>
        <Textarea
          label="Additional notes"
          value={form.notes}
          onChange={set('notes')}
          placeholder="Anything we should know? (e.g. parking, accessibility needs)"
          rows={3}
        />
        <Button
          type="submit"
          loading={status === 'loading'}
          className="w-full"
          size="lg"
        >
          Request Viewing
        </Button>
        <p className="text-xs text-charcoal-400 text-center">
          By submitting, you agree to us contacting you about this property. We&apos;ll never share your details.
        </p>
      </form>
    </div>
  )
}
