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

  <button @click="getToken()" class="nes-btn is-success" v-if="!loggedIn">Twitch Auth</button>

  <div class="flex-holder">
    <div class="column">
      <div class="scrolling-holder nes-container is-rounded is-dark with-title">
        <p class="title">Stream Topics
          <button type="button" class="nes-btn is-primary" @click="showNewForm = !showNewForm">Add new topic</button>
          <button type="button" class="nes-btn is-primary" @click="showHistory = !showHistory">Toggle History</button>
        </p>

        <div class="scrolling-content">

          <div v-for="(topic, index) of state.topics" :key="topic.id">
            <hr v-if="index !== 0">
            <h4> {{ topic.title }}  [{{topic.currentCounter}}]
              <button type="button" class="nes-btn is-warning" @click="showEditForm(topic)">Edit</button>
              <button type="button" class="nes-btn is-error" @click="deleteTopic(topic)">X</button>
            </h4>
            <h5>
              {{ generateTitle(topic) }} <br/>
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

            <button type="button" class="nes-btn is-warning" @click="increaseCounter(topic)">Increase Counter</button>
            <button type="button"
                    class="nes-btn"
                    :class="{'is-success': loggedIn, 'is-disabled': !loggedIn}"
                    @click="setupTwitch(topic)">Set Twitch Title & Tags</button>
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

// TODO extract handler / instance

@Options({
  components: {
    TopicForm,
    ClosablePanel
  }
})
export default class App extends Vue {
  state = store.state;

  startAnimate = false;

  authRedirectMode = new URLSearchParams(location.hash?.replace('#', '')).has('id_token');

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

  generateTitle (topic: Topic) {
    return generateTitle(topic);
  }

  setupTwitch (topic: Topic) {
    store.addHistoryEntry({
      task: `Applied ${topic.title}: ${topic.currentCounter}`
    });

    twitch.applyTopicToTwitch(topic);
  }

  getStream () {
    twitch.currentChannelInformation();
  }

  async getToken () {
    const {userId} = await twitch.login();
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
  max-height: calc(100vh - 8px);
  height: 100%;
}

.scrolling-content {
  height: calc(100% - 2rem - 8px);
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
