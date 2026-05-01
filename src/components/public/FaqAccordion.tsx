'use client'

import { useState, useRef } from 'react'
import { clsx } from 'clsx'
import { Plus, Minus } from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
  className?: string
  /** Allow multiple items open simultaneously */
  allowMultiple?: boolean
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const id = `faq-${index}`

  return (
    <div className={clsx('border-b border-charcoal-200 last:border-0', isOpen && 'bg-cream rounded-lg')}>
      <button
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-inset rounded-lg"
      >
        <span
          className={clsx(
            'text-sm font-semibold transition-colors',
            isOpen ? 'text-terracotta' : 'text-charcoal'
          )}
        >
          {item.question}
        </span>
        <span
          className={clsx(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors',
            isOpen ? 'bg-terracotta text-white' : 'bg-charcoal-100 text-charcoal-500'
          )}
        >
          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Animated container */}
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        ref={contentRef}
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 500}px` : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div className="px-4 pb-5 text-sm text-charcoal-600 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  )
}

export default function FaqAccordion({ items, className, allowMultiple = false }: FaqAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set([0]))

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        if (!allowMultiple) next.clear()
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className={clsx('divide-y divide-charcoal-200 rounded-xl border border-charcoal-200 bg-white', className)}>
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          item={item}
          isOpen={openIndexes.has(i)}
          onToggle={() => toggle(i)}
          index={i}
        />
      ))}
    </div>
  )
}
