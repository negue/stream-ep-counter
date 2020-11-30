<template>
  <div class="panel-holder">
    <slot></slot>
    <button type="button" class="nes-btn is-error floating-close-button" @click="cancel()">X</button>
  </div>
</template>

<script>
export default {
  name: 'ClosablePanel',
  methods: {
    cancel () {
      this.$emit('cancel');
    }
  }
}
</script>

<style scoped>
.panel-holder {
  position: relative;
}

.floating-close-button {
  position: absolute;
  top: -1rem;
  right: -1rem;
}
</style>
