<template>
  <h4> {{ topic.title }}  [{{topic.currentCounter}}]
    <button type="button" class="nes-btn is-warning" @click="$emit('show-edit-form', topic)">Edit</button>
    <button type="button" class="nes-btn is-error" @click="$emit('delete-topic', topic)">X</button>

    <span v-if="topic.customChannel"> @{{topic.customChannel}}</span>
  </h4>
  <h5>
    <span class="nes-text is-warning">{{ generateTitle(topic).slice(0, 32) }}</span>{{ generateTitle(topic).slice(32) }} <br/>
  </h5>

  <br>
  Game: {{topic.gameName ?? 'Need to "Import from Twitch"'}} <br />
  Tags:
  <span v-if="topic.tags">
    <span class="nes-badge"
          v-for="tagName of topic.tags?.split(',').map(id => state.tags[id]?.name)"
          :key="tagName"
    >
      <span class="is-primary">{{tagName}}</span>
    </span>
  </span>
  <span v-if="!topic.tags">
    Need to "Import from Twitch"
  </span>

  <br>
  <br>

  <span class="nes-text is-success">{{ lastAppliedLabel }}</span> <br/>
  <button type="button" class="nes-btn is-warning" @click="$emit('increase-counter', topic)">Increase Counter</button>
  <button type="button"
          class="nes-btn"
          :class="{'is-success': loggedIn, 'is-disabled': !loggedIn}"
          @click="$emit('setup-twitch', topic)">Set Twitch Title & Tags</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { State, Topic } from '@/types';
import { generateTitle } from '@/utils';
import { store } from '@/state';

export default defineComponent({
  props: {
    topic: {
      type: Object as () => Topic,
      required: true
    },
    loggedIn: {
      type: Boolean
    }
  },
  data () {
    return {
      state: store.state as State
    }
  },
  computed: {
    lastAppliedLabel (): string {
      const foundEntriesInHistory = this.state.history
        .filter(h => h.topicId === this.topic.id);

      if (foundEntriesInHistory.length > 0) {
        foundEntriesInHistory.sort(function (a, b) {
          if (!a.date || !b.date) {
            return 0;
          }

          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return Number(new Date(b.date)) - Number(new Date(a.date));
        });

        const latestEntry = foundEntriesInHistory[0];

        return `${new Date(latestEntry.date!).toLocaleString()} with the Title:  ${latestEntry.lastTitle}`;
      }

      console.info({ foundEntriesInHistory });

      return '';
    }
  },
  methods: {
    generateTitle (topic: Topic) {
      return generateTitle(topic);
    }
  }
});
</script>

<style scoped>

</style>
