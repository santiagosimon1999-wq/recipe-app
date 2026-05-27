import { useId } from 'react'
import { Modal } from './Modal'

export type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()

  return (
    <Modal
      isOpen
      onClose={onCancel}
      labelledBy={titleId}
      overlayClassName="confirm-dialog-overlay"
      contentClassName="confirm-dialog"
      closeOnOverlayClick={false}
    >
      <h2 id={titleId} className="confirm-dialog__title">
        {title}
      </h2>
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button
          type="button"
          className="confirm-dialog__cancel"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={
            variant === 'danger'
              ? 'confirm-dialog__confirm confirm-dialog__confirm--danger'
              : 'confirm-dialog__confirm'
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
