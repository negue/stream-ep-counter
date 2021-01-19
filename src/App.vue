<template>
  <div v-if="authRedirectMode">
    HI, You were authenticated, this window will close in 4 Seconds :)
  </div>

  <div v-else>

     <a class="github-link"
        href="https://github.com/negue/stream-ep-counter" target="_blank" rel="noopener"
        @mouseover="startAnimate = true"
        @mouseout="startAnimate = false">
            <i class="nes-octocat" :class="startAnimate ? 'animate' : ''"></i>
          </a>

  <div class="flex-holder">
    <div class="column">
      <div class="scrolling-holder ">
        <div class="nes-container is-rounded is-dark with-title">
          <p class="title">Stream Topics</p>

          <div>
          <button type="button" class="nes-btn is-primary" @click="showNewForm = !showNewForm">
            Add new topic
          </button>
          <button type="button" class="nes-btn is-primary" @click="showHistory = !showHistory">
            Toggle History
          </button>

          <button @click="getToken()" class="nes-btn is-success" v-if="!loggedIn">Twitch Auth</button>
          </div>
        </div>
        <div class="scrolling-content">

          <div v-for="(topic) of state.topics" :key="topic.id">
            <div class="nes-container is-rounded is-dark">
              <div>
            <topic-entry :topic="topic"
                         :loggedIn="loggedIn"
                         @show-edit-form="showEditForm($event)"
                         @delete-topic="deleteTopic($event)"
                         @increase-counter="increaseCounter($event)"
                         @setup-twitch="setupTwitch($event)"
                        >
            </topic-entry>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="nes-container is-rounded is-dark with-title"
           v-if="showNewForm">
        <p class="title">New Topic</p>

        <closable-panel @cancel="showNewForm = false">
          <topic-form @save="onAddNew"
                      @cancel="showNewForm = false"
                      :loggedIn="loggedIn"
          ></topic-form>
        </closable-panel>
      </div>
      <div class="nes-container is-rounded is-dark with-title"
           v-if="formForTopic">

        <p class="title">Edit Topic: {{formForTopic.title}}</p>

        <closable-panel @cancel="formForTopic = undefined">
          <topic-form :topic="formForTopic"
                      @save="editTopic"
                      @cancel="formForTopic = undefined"
                      :loggedIn="loggedIn"
          ></topic-form>
        </closable-panel>
      </div>

      <div class="nes-container is-rounded is-dark with-title"
           v-if="showHistory">

        <p class="title">Changed history:</p>
        <closable-panel @cancel="showHistory = false">
          <div v-for="(entry, index) of sortedHistory" :key="entry.id">
            <hr v-if="index !== 0">
            <h4> {{ entry.task }}</h4>
            {{new Date(entry.date).toLocaleString()}}
          </div>
        </closable-panel>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { store } from '@/state';
import TopicForm from '@/components/TopicForm.vue';
import { reactive } from 'vue';
import ClosablePanel from '@/components/ClosablePanel.vue';
import { Topic } from '@/types';
import { generateTitle } from '@/utils';
import { clientId, twitch } from '@/twitch-instance';
import TopicEntry from '@/components/TopicEntry.vue';

// TODO extract handler / instance

export const hashParams = new URLSearchParams(location.hash?.replace('#', ''));

@Options({
  components: {
    TopicForm,
    ClosablePanel,
    TopicEntry
  }
})
export default class App extends Vue {
  state = store.state;

  startAnimate = false;

  authRedirectMode = hashParams.has('id_token');

  loggedIn = true;
  showHistory = false;
  showNewForm = false;
  formForTopic?: Topic|null = reactive<any>(null);

  async mounted () {
    if (this.authRedirectMode) {
      twitch.checkTokens();
    }

    const loginResult = await twitch.loginExists();

    if (loginResult) {
      this.loggedIn = !!loginResult?.preferred_username;
    } else {
      this.loggedIn = false;
    }
  }

  get sortedHistory () {
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

  onAddNew (topic: Topic) {
    store.addTopic(topic);

    this.showNewForm = false;
  }

  deleteTopic (topic: Topic) {
    if (window.confirm('Delete this topic?')) {
      store.deleteTopic(topic);
    }
  }

  showEditForm (topic: Topic) {
    console.info({ topic });
    this.formForTopic = topic;
  }

  editTopic (topic: Topic) {
    console.info({ topic });
    store.editTopic(topic);
    this.formForTopic = null;
  }

  increaseCounter (topic: Topic) {
    topic.currentCounter++;
    store.editTopic(topic);

    // push new title to twitch
    console.info('Push title to Twitch: ', { ...topic });
  }

  setupTwitch (topic: Topic) {
    store.addHistoryEntry({
      task: `Applied ${topic.title}: ${topic.currentCounter}`,
      lastTitle: generateTitle(topic),
      topicId: topic.id ?? -1,
      lastCounter: topic.currentCounter
    });

    twitch.applyTopicToTwitch(topic);
  }

  async getToken () {
    const { userId } = await twitch.login();
    if (userId) {
      this.loggedIn = true;
    }
  }
}
</script>

<style lang="scss">

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  /* https://fonts.google.com/specimen/Press+Start+2P?query=Press+Start+2P */
  font-family: 'Press Start 2P', Arial, sans-serif;
}

.flex-holder {
  display: flex;
  flex-direction: row;
}

.column {
  flex: 1;

  &:empty {
    display: none;
  }
}

.scrolling-holder {
  max-height: calc(100vh);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scrolling-content {
  flex: 1;
  overflow-y: auto;
}

.nes-badge {
  margin-right: 1rem;
  white-space: initial;
}

.github-link {
    filter: drop-shadow(1px 1px 0 white) drop-shadow(-1px -1px 0 white);

    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 999;
    transition: all 0.3s ease;
}

</style>
