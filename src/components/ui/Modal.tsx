import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Used for `aria-labelledby` when `labelledBy` is not provided. */
  title?: string
  /** ID of an existing visible heading inside the dialog. */
  labelledBy?: string
  children: ReactNode
  overlayClassName?: string
  contentClassName?: string
  /** When true, clicking the backdrop calls `onClose`. Default true. */
  closeOnOverlayClick?: boolean
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

/**
 * Accessible modal shell: `role="dialog"`, focus trap, Escape to close,
 * return-focus on unmount. Content styling is delegated via className props
 * so existing recipe-modal styles keep working.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  labelledBy,
  children,
  overlayClassName = 'recipe-modal-overlay',
  contentClassName = 'recipe-modal',
  closeOnOverlayClick = true,
}: ModalProps) {
  const generatedTitleId = useId()
  const titleId = labelledBy ?? generatedTitleId
  const contentRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const frameId = window.requestAnimationFrame(() => {
      const content = contentRef.current
      if (!content) return

      const focusable = getFocusableElements(content)
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        content.focus()
      }
    })

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const content = contentRef.current
      if (!content) return

      const focusable = getFocusableElements(content)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !content.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (!closeOnOverlayClick) return
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Prevent Tab from escaping when there are no focusable children
    if (event.key !== 'Tab') return
    const content = contentRef.current
    if (!content) return
    if (getFocusableElements(content).length > 0) return
    event.preventDefault()
  }

  return createPortal(
    <div
      className={overlayClassName}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={contentRef}
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleContentKeyDown}
      >
        {!labelledBy && title ? (
          <h2 id={generatedTitleId} className="ui-modal__sr-title">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  )
}
