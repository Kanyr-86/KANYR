import { ref } from 'vue'

/**
 * Shared state for confirm dialog
 * This allows the dialog to be used globally without prop drilling
 */
const isOpen = ref(false)
const dialogOptions = ref(null)
let resolvePromise = null

/**
 * useConfirm - A composable for showing confirmation dialogs
 * 
 * Provides a Promise-based API for showing confirmation dialogs.
 * Useful for delete confirmations, action confirmations, etc.
 * 
 * Requires ConfirmDialog component to be mounted in the app (typically in App.vue)
 * 
 * @returns {Object} Confirm dialog controls
 * @returns {Function} returns.confirm - Show confirmation dialog, returns Promise<boolean>
 * @returns {Ref<boolean>} returns.isOpen - Whether dialog is currently open
 * @returns {Ref<Object>} returns.options - Current dialog options
 * @returns {Function} returns.handleConfirm - Called when user confirms
 * @returns {Function} returns.handleCancel - Called when user cancels
 * 
 * @example Basic usage
 * ```javascript
 * import { useConfirm } from '@/composables/useConfirm'
 * 
 * const { confirm } = useConfirm()
 * 
 * async function deleteStudent(student) {
 *   const result = await confirm({
 *     title: 'Diák törlése',
 *     message: `Biztosan törölni szeretnéd: ${student.name}?`,
 *     confirmText: 'Törlés',
 *     cancelText: 'Mégse',
 *     variant: 'danger'
 *   })
 *   
 *   if (result) {
 *     await api.deleteStudent(student.id)
 *     toast.success('Diák sikeresen törölve')
 *   }
 * }
 * ```
 * 
 * @example Simple confirmation
 * ```javascript
 * const { confirm } = useConfirm()
 * 
 * async function handleLogout() {
 *   const result = await confirm({
 *     title: 'Kijelentkezés',
 *     message: 'Biztosan ki szeretnél jelentkezni?',
 *     confirmText: 'Kijelentkezés',
 *     variant: 'primary'
 *   })
 *   
 *   if (result) {
 *     await authStore.logout()
 *   }
 * }
 * ```
 * 
 * @example In a component with ConfirmDialog
 * ```vue
 * <template>
 *   <div>
 *     <button @click="handleDelete">Delete</button>
 *     <ConfirmDialog />
 *   </div>
 * </template>
 * 
 * <script setup>
 * import { useConfirm } from '@/composables/useConfirm'
 * import ConfirmDialog from '@/components/ConfirmDialog.vue'
 * 
 * const { confirm } = useConfirm()
 * 
 * async function handleDelete() {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure?',
 *     variant: 'danger'
 *   })
 *   if (confirmed) {
 *     // Perform delete
 *   }
 * }
 * </script>
 * ```
 */
export function useConfirm() {
  /**
   * Show confirmation dialog
   * @param {Object} options - Dialog options
   * @param {string} [options.title='Megerősítés'] - Dialog title
   * @param {string} [options.message='Biztosan folytatod?'] - Confirmation message
   * @param {string} [options.confirmText='Megerősítés'] - Confirm button text
   * @param {string} [options.cancelText='Mégse'] - Cancel button text
   * @param {'danger' | 'primary'} [options.variant='danger'] - Button variant
   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
   */
  function confirm(options = {}) {
    return new Promise((resolve) => {
      dialogOptions.value = {
        title: options.title || 'Megerősítés',
        message: options.message || 'Biztosan folytatod?',
        confirmText: options.confirmText || 'Megerősítés',
        cancelText: options.cancelText || 'Mégse',
        variant: options.variant || 'danger'
      }
      resolvePromise = resolve
      isOpen.value = true
    })
  }

  /**
   * Handle confirm action - resolves promise with true
   */
  function handleConfirm() {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  /**
   * Handle cancel action - resolves promise with false
   */
  function handleCancel() {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    confirm,
    isOpen,
    options: dialogOptions,
    handleConfirm,
    handleCancel
  }
}

export default useConfirm