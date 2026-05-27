import { toast } from 'sonner'

/** Thin wrapper so call sites don't import sonner directly everywhere. */
export const notify = {
  success(message: string) {
    toast.success(message)
  },
  error(message: string) {
    toast.error(message)
  },
  info(message: string) {
    toast.message(message)
  },
}
