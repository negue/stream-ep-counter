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

            <button type="button" class="nes-btn is-primary" @click="showOptions = !showOptions">
              Toggle Options
            </button>

          <button @click="getToken()"
                  class="nes-btn is-success"
                  v-if="!loggedIn">Twitch Auth</button>
          <button @click="logout()"
                  class="nes-btn is-error"
                  v-if="loggedIn">Logout: {{userName}}</button>
          </div>
        </div>
        <scrolling-content class="scrolling-content-outer">
          <div class="scrolling-content-inner">
            <div v-for="(topic) of state.topics" :key="topic.id" class="topic-container">
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
        </scrolling-content>
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
          <history-list></history-list>
        </closable-panel>
      </div>
    </div>
  </div>

  <modal v-model:opened="showOptions">
    <options-vue @cancel="showOptions = false"></options-vue>
  </modal>
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
import { twitch } from '@/twitch-instance';
import TopicEntry from '@/components/TopicEntry.vue';
import HistoryList from '@/components/HistoryList.vue';
import OptionsVue from '@/components/Options.vue';
import ScrollingContent from '@/components/ScrollingContent.vue';
import Modal from '@/components/Modal.vue';

// TODO extract handler / instance

function wait (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const hashParams = new URLSearchParams(location.hash?.replace('#', ''));

@Options({
  components: {
    Modal,
    TopicForm,
    ClosablePanel,
    TopicEntry,
    HistoryList,
    OptionsVue,
    ScrollingContent
  }
})
export default class App extends Vue {
  state = store.state;

  startAnimate = false;

  authRedirectMode = hashParams.has('id_token');

  loggedIn = false;
  userName = '';
  showHistory = false;
  showOptions = false;
  showNewForm = false;
  formForTopic?: Topic|null = reactive<any>(null);

  async mounted () {
    if (this.authRedirectMode) {
      twitch.checkTokens();
    }

    const loginResult = await twitch.loginExists();

    console.info({ loginResult });
    if (loginResult) {
      this.loggedIn = !!loginResult?.preferred_username;
      if (!this.loggedIn) {
        this.loggedIn = false;
        twitch.resetAuth();
        return;
      }

      this.userName = loginResult.preferred_username;
    } else {
      this.loggedIn = false;
    }
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

  async setupTwitch (topic: Topic) {
    store.addHistoryEntry({
      task: `Applied ${topic.title}: ${topic.currentCounter}`,
      lastTitle: generateTitle(topic),
      topicId: topic.id ?? -1,
      lastCounter: topic.currentCounter
    });

    await twitch.applyTopicToTwitch(topic);

    for (const command of topic.commands) {
      await twitch.writeToChat(command);
      await wait(1000);
    }
  }

  async getToken () {
    const { userId, userName } = await twitch.login();
    if (userId) {
      this.loggedIn = true;
      this.userName = userName;
    }
  }

  logout () {
    twitch.resetAuth();
    this.loggedIn = false;
    this.userName = '';
  }
}
</script>

<style lang="scss">

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #212529;
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

.topic-container {
  width: calc(50% - 0.5rem);
}

.scrolling-content-outer {
  flex: 1;
  //noinspection CssInvalidPropertyValue
  overflow-y: clip;
}

.scrolling-content-inner {
  display: flex;
  flex-wrap: wrap;
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

.vfm__container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.vfm__content {
  display: flex;
  flex-direction: column;
  margin: 0 1rem;
  padding: 1rem;
}

.nes-dialog {
  border-style: solid;
  border-color: #3e4446 !important;
  padding: 1rem 1rem;
}

</style>
