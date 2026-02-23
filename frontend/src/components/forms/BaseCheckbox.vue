<template>
  <div class="mb-3">
    <div class="form-check">
      <input
        :id="checkboxId"
        type="checkbox"
        class="form-check-input"
        :class="{ 'is-invalid': error }"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      >
      <label
        v-if="label"
        :for="checkboxId"
        class="form-check-label"
      >
        {{ label }}
      </label>
      <div v-if="error" class="invalid-feedback">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'BaseCheckbox',

  props: {
    /**
     * Label text displayed next to the checkbox
     * @type {string}
     */
    label: {
      type: String,
      default: ''
    },

    /**
     * Current checked state of the checkbox (v-model)
     * @type {boolean}
     */
    modelValue: {
      type: Boolean,
      default: false
    },

    /**
     * Error message to display
     * @type {string}
     */
    error: {
      type: String,
      default: ''
    },

    /**
     * Whether the checkbox is disabled
     * @type {boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * Custom ID for the checkbox (auto-generated if not provided)
     * @type {string}
     */
    id: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  setup(props) {
    const checkboxId = computed(() => {
      return props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    })

    return {
      checkboxId
    }
  }
})
</script>