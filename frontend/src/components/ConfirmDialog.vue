<template>
  <BaseModal
    v-model:show="isOpen"
    :title="dialogTitle"
    size="sm"
    :close-on-backdrop="false"
    hide-footer
    @close="handleCancel"
  >
    <div class="confirm-dialog">
      <!-- Icon -->
      <div class="confirm-icon" :class="variantClass">
        <svg v-if="currentVariant === 'danger'" xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      </div>

      <!-- Message -->
      <p class="confirm-message">{{ dialogMessage }}</p>

      <!-- Buttons -->
      <div class="confirm-actions">
        <BaseButton
          variant="outline-secondary"
          @click="handleCancel"
        >
          {{ dialogCancelText }}
        </BaseButton>
        <BaseButton
          :variant="currentVariant"
          @click="handleConfirm"
        >
          {{ dialogConfirmText }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useConfirm } from '../composables/useConfirm'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

/**
 * ConfirmDialog - A confirmation dialog component
 * 
 * Used with useConfirm composable for Promise-based confirmation dialogs.
 * Should be mounted at app root level (App.vue) for global access.
 * 
 * Usage:
 * - Add ConfirmDialog to App.vue template
 * - Use useConfirm() composable to show dialogs
 * 
 * Example:
 * const { confirm } = useConfirm()
 * const result = await confirm({ title: 'Title', message: 'Message' })
 */
export default defineComponent({
  name: 'ConfirmDialog',

  components: {
    BaseModal,
    BaseButton
  },

  setup() {
    const { isOpen, options, handleConfirm: confirm, handleCancel: cancel } = useConfirm()

    /**
     * Current dialog title
     */
    const dialogTitle = computed(() => options.value?.title || 'Megerősítés')

    /**
     * Current dialog message
     */
    const dialogMessage = computed(() => options.value?.message || 'Biztosan folytatod?')

    /**
     * Confirm button text
     */
    const dialogConfirmText = computed(() => options.value?.confirmText || 'Megerősítés')

    /**
     * Cancel button text
     */
    const dialogCancelText = computed(() => options.value?.cancelText || 'Mégse')

    /**
     * Current variant for styling
     */
    const currentVariant = computed(() => options.value?.variant || 'danger')

    /**
     * Variant class for icon color
     */
    const variantClass = computed(() => {
      return currentVariant.value === 'danger' ? 'text-danger' : 'text-primary'
    })

    return {
      isOpen,
      dialogTitle,
      dialogMessage,
      dialogConfirmText,
      dialogCancelText,
      currentVariant,
      variantClass,
      handleConfirm: confirm,
      handleCancel: cancel
    }
  }
})
</script>

<style scoped>
.confirm-dialog {
  text-align: center;
  padding: 0.5rem 0;
}

.confirm-icon {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.confirm-icon.text-danger svg {
  fill: #dc3545;
}

.confirm-icon.text-primary svg {
  fill: #0d6efd;
}

.confirm-message {
  font-size: 1rem;
  color: #495057;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.confirm-actions .btn {
  min-width: 100px;
}
</style>