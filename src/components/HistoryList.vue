<template>
  <div v-for="(entry, index) of sortedHistory" :key="entry.id">
    <hr v-if="index !== 0">
    <h4> {{ entry.task }}</h4>
    {{new Date(entry.date).toLocaleString()}}
  </div>
</template>

<script lang="ts">
import { store } from '../state';
import { HistoryEntry, State } from '../types';
import { defineComponent } from 'vue';

export default defineComponent({
  data () {
    return {
      state: store.state as State
    }
  },
  computed: {
    sortedHistory (): HistoryEntry[] {
      const newArray = [...this.state.history];

      newArray.sort((a, b) => {
        const aDate = Date.parse(a.date!.toString());
        const bDate = Date.parse(b.date!.toString());

        if (aDate < bDate) {
          return 1;
        } else if (aDate > bDate) {
          return -1
        } else {
          return 0
        }
      });

      return newArray.slice(0, 7);
    }
  }
});
</script>

<style scoped>

</style>
