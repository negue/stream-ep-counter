<template>
  <button type="button" class="nes-btn is-primary" @click="exportData()">
    Export data
  </button>

  <button type="button" class="nes-btn is-primary" @click="importData()">
    Import data
  </button><br/><br/>

  <textarea class="nes-textarea" rows="10" v-model="topics"></textarea>
</template>

<script>
import { Vue } from 'vue-class-component';
import { store } from '@/state';

export default class Settings extends Vue {
  state = store.state;
  topics = '';

  get currentTopics () {
    return this.state.topics.filter(t => !t.archived);
  }

  get archivedTopics () {
    return this.state.topics.filter(t => t.archived);
  }

  exportData () {
    const data = this.currentTopics;
    this.archivedTopics.map((t) => data.push(t));
    this.topics = JSON.stringify(data);
  }

  importData () {
    try {
      const data = JSON.parse(this.topics);
      if (data) {
        this.currentTopics.map((t) => store.deleteTopic(t));
        this.archivedTopics.map((t) => store.deleteTopic(t));

        data.map((d) => store.addTopic(d));
      }
    } catch (exception) {
      console.error(exception);
    }
  }
};
</script>

<style scoped>

</style>
