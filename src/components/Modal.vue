<template>
  <vue-final-modal v-model="opened">
    <div class="nes-dialog is-dark" v-if="opened">
      <closable-panel @cancel="opened = false">
        <slot></slot>
      </closable-panel>
    </div>
  </vue-final-modal>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator';
import ClosablePanel from '@/components/ClosablePanel.vue';

@Options({
  components: {
    ClosablePanel

  }
})
export default class Modal extends Vue {
  @Prop({ default: false }) opened!: boolean;
}
</script>

<style scoped>

</style>
