# KANYR Frontend Components Documentation

This document provides comprehensive documentation for all frontend components in the KANYR project.

## Component Architecture Overview

The KANYR frontend follows a well-organized component architecture with clear separation of concerns:

- **Layout Components** - Page structure and layout
- **Form Components** - Input and form controls
- **UI Components** - Reusable UI elements
- **Utility Components** - Helper and service components

## Component Categories

### 1. Layout Components (`/frontend/src/components/layout/`)

#### PageHeader.vue
Consistent page headers with breadcrumbs, titles, and action buttons.

**Props:**
- `title` (string, required) - Page title
- `subtitle` (string, optional) - Optional subtitle
- `breadcrumbs` (array, optional) - Breadcrumb items with labels and routes

**Usage:**
```vue
<PageHeader 
  title="Diákok" 
  subtitle="Összes regisztrált diák listája" 
  :breadcrumbs="[
    { label: 'Kezdőlap', to: '/' },
    { label: 'Diákok' }
  ]"
>
  <template #actions>
    <BaseButton variant="primary">Diák hozzáadása</BaseButton>
  </template>
</PageHeader>
```

#### PageContent.vue
Wrapper component for page content with consistent padding.

**Props:**
- `noPadding` (boolean, default: false) - Remove default padding for full-width content

**Usage:**
```vue
<PageContent>
  <p>Your page content here</p>
</PageContent>

<!-- Full-width content -->
<PageContent noPadding>
  <BaseTable :columns="columns" :items="items" />
</PageContent>
```

#### EmptyState.vue
Shows when no data is available, with customizable icons, titles, descriptions, and action buttons.

**Props:**
- `icon` (string, optional) - Icon type ('inbox', 'users', or default plus icon)
- `title` (string, optional) - Title text
- `description` (string, optional) - Description text
- `actionText` (string, optional) - Action button text
- `actionRoute` (string|object, optional) - Route for action button

**Usage:**
```vue
<EmptyState
  icon="inbox"
  title="Nincsenek diákok"
  description="Még nem regisztráltak diákok a rendszerbe."
  actionText="Diák hozzáadása"
  action-route="/students/new"
/>
```

#### ErrorState.vue
Shows when an error occurs, with optional retry functionality.

**Props:**
- `title` (string, optional) - Error title
- `message` (string, optional) - Error message
- `retryAction` (function, optional) - Retry action callback

**Usage:**
```vue
<ErrorState
  title="Betöltési hiba"
  message="Nem sikerült betölteni az adatokat."
  :retry-action="fetchData"
/>
```

### 2. Form Components (`/frontend/src/components/forms/`)

#### BaseInput.vue
Standard input fields with validation support and Bootstrap 5 styling.

**Props:**
- `label` (string, optional) - Label text
- `type` (string, default: 'text') - Input type (text, email, password, number, date, tel, url, search)
- `modelValue` (string|number) - Current value (v-model)
- `error` (string, optional) - Error message
- `placeholder` (string, optional) - Placeholder text
- `required` (boolean, default: false) - Whether field is required
- `disabled` (boolean, default: false) - Whether input is disabled
- `id` (string, optional) - Custom ID

**Usage:**
```vue
<BaseInput
  v-model="form.name"
  :error="errors.name"
  label="Név"
  placeholder="Add meg a neved"
  required
/>
```

#### BaseSelect.vue
Dropdown select components with option arrays and validation.

**Props:**
- `label` (string, optional) - Label text
- `options` (array, required) - Array of { value, label } objects
- `modelValue` (string|number) - Current value (v-model)
- `error` (string, optional) - Error message
- `placeholder` (string, optional) - Placeholder text
- `required` (boolean, default: false) - Whether field is required
- `disabled` (boolean, default: false) - Whether select is disabled
- `id` (string, optional) - Custom ID

**Usage:**
```vue
<BaseSelect
  v-model="form.roomId"
  :options="roomOptions"
  :error="errors.roomId"
  label="Szoba"
  placeholder="Válassz szobát"
/>
```

#### BaseTextarea.vue
Multi-line text input with configurable rows and validation.

**Props:**
- `label` (string, optional) - Label text
- `modelValue` (string) - Current value (v-model)
- `error` (string, optional) - Error message
- `placeholder` (string, optional) - Placeholder text
- `rows` (number, default: 3) - Number of visible text lines
- `required` (boolean, default: false) - Whether field is required
- `disabled` (boolean, default: false) - Whether textarea is disabled
- `id` (string, optional) - Custom ID

**Usage:**
```vue
<BaseTextarea
  v-model="form.description"
  :error="errors.description"
  label="Leírás"
  rows="4"
  placeholder="Add meg a leírást"
/>
```

#### BaseCheckbox.vue
Checkbox inputs with labels and validation.

**Props:**
- `label` (string, optional) - Label text
- `modelValue` (boolean) - Current checked state (v-model)
- `error` (string, optional) - Error message
- `disabled` (boolean, default: false) - Whether checkbox is disabled
- `id` (string, optional) - Custom ID

**Usage:**
```vue
<BaseCheckbox
  v-model="form.isActive"
  :error="errors.isActive"
  label="Aktív"
/>
```

### 3. UI Components (`/frontend/src/components/`)

#### BaseButton.vue
Reusable buttons with Bootstrap 5 styling, loading states, and icons.

**Props:**
- `variant` (string, default: 'primary') - Button style variant
- `size` (string, default: 'md') - Button size (sm, md, lg)
- `loading` (boolean, default: false) - Show loading spinner
- `disabled` (boolean, default: false) - Disable button
- `type` (string, default: 'button') - Button type (button, submit, reset)
- `icon` (string, optional) - Bootstrap icon class
- `block` (boolean, default: false) - Make button full width

**Usage:**
```vue
<BaseButton variant="primary" :loading="isSubmitting" @click="handleSubmit">
  {{ isSubmitting ? 'Mentés...' : 'Mentés' }}
</BaseButton>

<BaseButton variant="success" icon="bi-save">
  Mentés
</BaseButton>
```

#### BaseCard.vue
Card containers with headers, footers, and loading states.

**Props:**
- `title` (string, optional) - Card title
- `subtitle` (string, optional) - Subtitle text
- `loading` (boolean, default: false) - Show skeleton loader
- `noPadding` (boolean, default: false) - Remove default padding
- `variant` (string, default: 'default') - Border color variant
- `shadow` (boolean, default: false) - Add shadow and hover effect

**Usage:**
```vue
<BaseCard title="Diák információk" variant="primary" shadow>
  <p>John Doe - 10. évfolyam</p>
  <template #actions>
    <BaseButton variant="outline-primary" size="sm">Szerkesztés</BaseButton>
  </template>
</BaseCard>
```

#### BaseTable.vue
Data tables with sorting, pagination, and loading skeletons.

**Props:**
- `columns` (array, required) - Column definitions
- `items` (array, default: []) - Array of data items
- `loading` (boolean, default: false) - Show loading skeleton
- `sortKey` (string, optional) - Current sort column
- `sortOrder` (string, default: 'asc') - Sort order
- `emptyText` (string, default: 'Nincs megjeleníthető adat') - Empty state message
- `hoverable` (boolean, default: true) - Enable row hover effect
- `striped` (boolean, default: false) - Enable striped rows

**Usage:**
```vue
<BaseTable
  :columns="columns"
  :items="students"
  :loading="loading"
  @sort="handleSort"
  @row-click="handleRowClick"
>
  <template #cell-name="{ item }">
    <router-link :to="`/students/${item.id}`">{{ item.name }}</router-link>
  </template>
  
  <template #actions="{ item }">
    <BaseButton variant="outline-primary" size="sm">Szerkesztés</BaseButton>
    <BaseButton variant="outline-danger" size="sm">Törlés</BaseButton>
  </template>
</BaseTable>
```

#### BaseModal.vue
Modal dialogs with configurable sizes and backdrop behavior.

**Props:**
- `title` (string, optional) - Modal header title
- `show` (boolean, required) - Controls modal visibility
- `size` (string, default: 'md') - Modal size (sm, md, lg, xl)
- `hideFooter` (boolean, default: false) - Hide default footer
- `closeOnBackdrop` (boolean, default: true) - Allow closing by clicking backdrop
- `closeOnEscape` (boolean, default: true) - Allow closing by pressing Escape

**Usage:**
```vue
<BaseModal
  v-model:show="showModal"
  title="Diák szerkesztése"
  size="lg"
  @close="closeModal"
>
  <StudentForm :student="selectedStudent" @save="handleSave" />
</BaseModal>
```

#### ConfirmDialog.vue
Confirmation dialogs used with the `useConfirm` composable.

**Usage:**
```vue
<template>
  <div>
    <ConfirmDialog />
    <BaseButton @click="handleDelete">Diák törlése</BaseButton>
  </div>
</template>

<script>
import { useConfirm } from '@/composables/useConfirm'

export default {
  setup() {
    const { confirm } = useConfirm()
    
    const handleDelete = async () => {
      const result = await confirm({
        title: 'Diák törlése',
        message: 'Biztosan törölni szeretnéd?',
        confirmText: 'Törlés',
        variant: 'danger'
      })
      
      if (result) {
        await deleteStudent()
      }
    }
    
    return { handleDelete }
  }
}
</script>
```

#### NotificationInbox.vue
Notification system with real-time updates and filtering.

**Usage:**
```vue
<NotificationInbox
  :notifications="notifications"
  :loading="loading"
  @mark-read="markAsRead"
  @delete="deleteNotification"
/>
```

#### Sidebar.vue
Navigation sidebar with role-based menu items and theme toggle.

**Usage:**
```vue
<Sidebar
  :user="currentUser"
  :is-collapsed="sidebarCollapsed"
  @toggle-collapse="toggleSidebar"
/>
```

#### ToastContainer.vue
Toast notifications with different types and automatic dismissal.

**Usage:**
```vue
<ToastContainer />
```

#### LoadingOverlay.vue
Full-screen loading overlay with backdrop and spinner.

**Props:**
- `show` (boolean, required) - Controls visibility
- `message` (string, optional) - Optional message
- `opacity` (number, default: 0.5) - Backdrop opacity

**Usage:**
```vue
<LoadingOverlay :show="isLoading" message="Adatok betöltése..." />
```

#### LoadingScreen.vue
Simple loading screen component for initial page loads.

**Usage:**
```vue
<LoadingScreen v-if="isLoading" />
<PageContent v-else>
  <!-- Page content -->
</PageContent>
```

#### ErrorBoundary.vue
Error boundary for catching component errors and displaying user-friendly messages.

**Usage:**
```vue
<ErrorBoundary>
  <StudentList />
</ErrorBoundary>
```

### 4. Utility Components

#### HelloWorld.vue
Basic Vue component example (likely for testing and development).

## Key Composables

### useFormValidation
Provides reactive validation state and methods for form validation.

```javascript
import { useFormValidation } from '@/composables/useFormValidation'

const rules = {
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, email: true },
  age: { required: true, min: 18, max: 100 }
}

const { errors, validate, isValid } = useFormValidation(rules)
```

### useConfirm
Provides Promise-based API for showing confirmation dialogs.

```javascript
import { useConfirm } from '@/composables/useConfirm'

const { confirm } = useConfirm()

const handleDelete = async () => {
  const result = await confirm({
    title: 'Törlés megerősítése',
    message: 'Biztosan törölni szeretnéd?',
    confirmText: 'Törlés',
    variant: 'danger'
  })
  
  if (result) {
    // Perform deletion
  }
}
```

## Styling and Theming

### CSS Architecture

- **`variables.css`** - CSS custom properties for theming
- **`theme.css`** - Theme-specific styles and overrides
- **`global-components.css`** - Global component styles

### Bootstrap 5 Integration

All components are built on Bootstrap 5 classes with custom enhancements for:
- Consistent spacing and padding
- Responsive design patterns
- Accessibility improvements
- Custom color schemes

## State Management

### Pinia Stores

- **`auth.js`** - Authentication state and user information
- **`theme.js`** - Theme preferences and dark mode
- **`toast.js`** - Toast notification management
- **`api.js`** - API state management

## Best Practices

### Component Usage Patterns

1. **Form Implementation**
   - Use form components with validation
   - Implement loading states for submissions
   - Provide clear error messages

2. **Table Implementation**
   - Use BaseTable for consistent data display
   - Implement sorting and filtering
   - Provide loading states and empty states

3. **Modal Usage**
   - Use BaseModal for consistent modal behavior
   - Implement proper focus management
   - Handle backdrop clicks appropriately

4. **Error Handling**
   - Use ErrorBoundary for component-level errors
   - Implement user-friendly error messages
   - Provide retry mechanisms where appropriate

### Accessibility Features

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Component Examples

### Complete Form Example
```vue
<template>
  <BaseCard title="Diák hozzáadása">
    <form @submit.prevent="handleSubmit">
      <BaseInput
        v-model="form.name"
        :error="errors.name"
        label="Név"
        required
      />
      <BaseSelect
        v-model="form.roomId"
        :options="roomOptions"
        :error="errors.roomId"
        label="Szoba"
        placeholder="Válassz szobát"
      />
      <BaseTextarea
        v-model="form.description"
        :error="errors.description"
        label="Leírás"
        rows="4"
      />
      <div class="d-flex gap-2">
        <BaseButton type="submit" :loading="isSubmitting">
          Mentés
        </BaseButton>
        <BaseButton variant="secondary" @click="$router.back()">
          Mégse
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script>
import { useFormValidation } from '@/composables/useFormValidation'

export default {
  setup() {
    const rules = {
      name: { required: true, minLength: 2 },
      roomId: { required: true }
    }
    
    const { errors, validate } = useFormValidation(rules)
    
    const handleSubmit = async () => {
      if (validate(form)) {
        // Submit form
      }
    }
    
    return { errors, handleSubmit }
  }
}
</script>
```

This documentation provides a comprehensive guide to using and understanding the KANYR frontend component architecture.