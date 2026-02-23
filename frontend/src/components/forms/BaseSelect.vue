<template>
  <div class="mb-3">
    <label
      v-if="label"
      :for="selectId"
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <select
      :id="selectId"
      class="form-select"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'BaseSelect',

  props: {
    /**
     * Label text displayed above the select
     * @type {string}
     */
    label: {
      type: String,
      default: ''
    },

    /**
     * Array of options with { value, label } structure
     * @type {Array<{value: string|number, label: string}>}
     */
    options: {
      type: Array,
      default: () => [],
      validator: (value) => {
        return value.every(opt => 
          typeof opt === 'object' && 
          'value' in opt && 
          'label' in opt
        )
      }
    },

    /**
     * Current value of the select (v-model)
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
     * Placeholder text for the default option
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
     * Whether the select is disabled
     * @type {boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * Custom ID for the select (auto-generated if not provided)
     * @type {string}
     */
    id: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue'],

  setup(props) {
    const selectId = computed(() => {
      return props.id || `select-${Math.random().toString(36).substr(2, 9)}`
    })

    return {
      selectId
    }
  }
})
</script>