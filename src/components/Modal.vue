<template>
  <vue-final-modal v-model="isOpened">
    <div class="nes-dialog is-dark" v-if="isOpened">
      <closable-panel @cancel="closeModal()">
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

  },

  watch: {
    opened (newOpenedValue) {
      this.isOpened = newOpenedValue;
    }
  }
})
export default class Modal extends Vue {
  @Prop({ default: false })
  opened!: boolean;

  public isOpened = this.opened;

  closeModal () {
    this.isOpened = false;
    this.$emit('closed', true);
  }
}
</script>

<style scoped>

</style>
