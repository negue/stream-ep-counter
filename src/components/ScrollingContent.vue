<template>
  <div ref="simplebar">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import SimpleBar from 'simplebar';

@Options({
  components: {

  }
})
export default class ScrollingContent extends Vue {
  // annotate refs type.
  // The symbol `!` (definite assignment assertion)
  // is needed to get rid of compilation error.
  declare $refs: {
    simplebar: HTMLElement;
  }

  mounted () {
    // eslint-disable-next-line no-new
    new SimpleBar(this.$refs.simplebar, {
      autoHide: false
    });
  }
}
</script>

<style lang="scss">
.simplebar-scrollbar::before {
  background-color: white !important;
}
</style>
