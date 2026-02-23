<template>
  <div class="mb-3">
    <label
      v-if="label"
      :for="textareaId"
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <textarea
      :id="textareaId"
      class="form-control"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :required="required"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>
    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'BaseTextarea',

  props: {
    /**
     * Label text displayed above the textarea
     * @type {string}
     */
    label: {
      type: String,
      default: ''
    },

    /**
     * Current value of the textarea (v-model)
     * @type {string}
     */
    modelValue: {
      type: String,
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
     * Number of visible text lines
     * @type {number}
     */
    rows: {
      type: Number,
      default: 3
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
     * Whether the textarea is disabled
     * @type {boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * Custom ID for the textarea (auto-generated if not provided)
     * @type {string}
     */
    id: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  setup(props) {
    const textareaId = computed(() => {
      return props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    })

    return {
      textareaId
    }
  }
})
</script>