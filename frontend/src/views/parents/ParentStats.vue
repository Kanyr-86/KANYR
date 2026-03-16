<template>
  <div class="row">
    <div class="col-6">
      <div class="card">
        <div class="card-body text-center">
          <h6 class="card-title mb-1">Összes szülő</h6>
          <h3 class="mb-0">
            <template v-if="loading">
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </template>
            <template v-else>{{ totalCount }}</template>
          </h3>
        </div>
      </div>
    </div>
    <div class="col-6">
      <div class="card">
        <div class="card-body text-center">
          <h6 class="card-title mb-1">Összes gyerek</h6>
          <h3 class="mb-0">
            <template v-if="loading">
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </template>
            <template v-else>{{ childrenCount }}</template>
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParentStats',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    totalCount: {
      type: Number,
      default: 0
    },
    childrenCount: {
      type: Number,
      default: 0
    }
  }
}
</script>
