<template>
  <div class="mb-3">
    <label
      v-if="label"
      :for="inputId"
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      class="form-control"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    >
    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'BaseInput',

  props: {
    /**
     * Label text displayed above the input
     * @type {string}
     */
    label: {
      type: String,
      default: ''
    },

    /**
     * Input type (text, email, password, number, date, tel, etc.)
     * @type {string}
     */
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'email', 'password', 'number', 'date', 'tel', 'url', 'search'].includes(value)
    },

    /**
     * Current value of the input (v-model)
     * @type {string|number}
     */
    modelValue: {
      type: [String, Number],
      default: ''
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
     * Placeholder text
     * @type {string}
     */
    placeholder: {
      type: String,
      default: ''
    },

    /**
     * Whether the field is required
     * @type {boolean}
     */
    required: {
      type: Boolean,
      default: false
    },

    /**
     * Whether the input is disabled
     * @type {boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * Custom ID for the input (auto-generated if not provided)
     * @type {string}
     */
    id: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  setup(props) {
    const inputId = computed(() => {
      return props.id || `input-${Math.random().toString(36).substr(2, 9)}`
    })

    return {
      inputId
    }
  }
})
</script>