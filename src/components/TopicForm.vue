<template>
  <scrolling-content class="topic-form-outer">
    <div class="form-holder topic-form">
      <div class="column">
        <div class="nes-field">
          <label for="name_field"> Topic </label>
          <input type="text" id="name_field" class="nes-input"
                 :class="{'is-error': !workingTopic.title }"
                 :required="!workingTopic.title"
                 autocomplete="off"
                 v-model="workingTopic.title">
        </div>

        <div class="nes-field">
          <label>
            <input type="checkbox" class="nes-checkbox is-dark" v-model="customChannel" />
            <span>Custom Channel</span>
          </label>
          <input type="text" class="nes-input" v-if="customChannel"
                 :class="{'is-error': customChannel && !workingTopic.customChannel, 'is-disabled': !customChannel }"
                 :required="!workingTopic.customChannel"
                 :disabled="!customChannel"
                 autocomplete="off"
                 v-model="workingTopic.customChannel">
        </div>

        <div class="nes-field">
          <label for="counter_field">Counter</label>
          <input type="number" id="counter_field" class="nes-input"
                 autocomplete="off"
                 v-model="workingTopic.currentCounter">
        </div>

        <div class="nes-field">
          <label for="title_field">Title-Template</label>
          <textarea id="title_field" class="nes-textarea"
                    v-model="workingTopic.template"></textarea>

          <div v-if="!workingTopic.template?.includes('{{counter}}')">
            <i>You need to use <code>{{counterPlaceholder}}</code> as placeholder. </i>
          </div>

          <span class="nes-text is-error" v-if="isTemplateInvalid">
            {{ notValidTemplateExplanation }}
          </span>
        </div>

        <div class="nes-field">
          <label>In Twitch Overview</label>
          <span class="nes-text is-warning">
          {{ generatedTitle.slice(0, 32) }}
        </span>

        </div>

        <div class="nes-field" v-if="false">
          <label for="notification_field">Going-Live Notification Text</label>
          <textarea id="notification_field" class="nes-textarea"
                    v-model="workingTopic.notificationText"></textarea>

          <span class="nes-text is-error" v-if="isNotificationInvalid">
            {{ notValidNotificationExplanation }}
          </span>

          <span class="nes-text">
            {{ generatedNotification }}
          </span>
        </div>

        <div class="nes-field">
          <label>Tags</label>
          <tags-input element-id="tags" ref="tagsInput"
                      :value="currentTags"
                      @tags-updated="updateTags($event)"
                      :only-existing-tags="true"
                      id-field="id"
                      text-field="name"
                      :existing-tags="allTags"
                      :typeahead="true"
                      placeholder="Select tags"
                      :typeahead-activation-threshold="0"
                      :typeahead-max-results="10"
          >
            <template v-slot:selected-tag="{ tag, index, removeTag }">
              {{tag.name}}
              <span class="is-danger" @click.prevent="removeTag(index)">X</span>

            </template>
          </tags-input>
        </div>

      </div>

      <div class="column">
      <div class="nes-field">
        <label>
          Commands

          <button type="button" class="nes-btn" @click="addCommand()">Add new command</button>
        </label>

        <div v-for="(command, index) of workingTopic.commands"
             :key="index"
        class="command_item">
          <input type="text" class="nes-input"
                 autocomplete="off"
                 v-model="command.name">

          <button type="button" class="nes-btn is-error" @click="removeCommand(index)">X</button>
          <br/>

          <textarea class="nes-textarea"
                    v-model="command.content"></textarea>

        </div>
      </div>

      <br>
      <div v-if="workingTopic.gameName || workingTopic.tags">
        <br>
        Game: {{workingTopic.gameName}} <br />
        <br>
      </div>

      <br/>
      <button type="button" class="nes-btn"
              :class="{'is-is-error': loggedIn, 'is-disabled': !loggedIn}"
              @click="importFromTwitch()">Import from Twitch</button>

    </div>
    </div>
  </scrolling-content>

  <br/>

  <button v-if="!!workingTopic.id" type="button" class="nes-btn is-error"
          @click="archiveTopic()">Archive</button>

  <button type="button" class="nes-btn is-error" @click="cancel()">Cancel</button>
  <button type="button" class="nes-btn" @click="save()">Save</button>

</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { TagData, Topic } from '@/types';
import { store } from '@/state';
import { twitch } from '@/twitch-instance';
import TagsInput from '@voerro/vue-tagsinput';
import { convertTwitchTagsToTagData, generateNotification, generateTitle } from '@/utils';
import ScrollingContent from '@/components/ScrollingContent.vue';

export default defineComponent({
  components: {
    ScrollingContent,
    TagsInput
  },
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
      workingTopic: { ...this.topic } as Topic,
      counterPlaceholder: '{{counter}}',
      currentTags: [] as TagData[],
      state: store.state,
      customChannel: !!this.topic?.customChannel
    }
  },
  computed: {
    allTags (): TagData[] {
      const allTags = [...Object.values(this.state.tags)];

      if (this.workingTopic?.importTags) {
        allTags.push(...this.workingTopic.importTags);
      }

      return allTags;
    },
    generatedTitle (): string {
      return generateTitle({
        ...this.workingTopic
      });
    },
    generatedNotification (): string {
      return generateNotification({
        ...this.workingTopic
      });
    },
    isTemplateInvalid (): boolean {
      return this.notValidTemplateExplanation !== '';
    },
    notValidTemplateExplanation (): string {
      const template = this.workingTopic.template;

      if (!template) {
        return 'You need a template.';
      }

      const generatedTitle = generateTitle({
        ...this.workingTopic,
        currentCounter: 100
      });

      const titleLength = generatedTitle.length;

      if (titleLength > 140) {
        return `A generated topic can be only 140 characters long. (Using 100 as counter) - Current Length: ${titleLength}`;
      }

      return '';
    },

    isNotificationInvalid (): boolean {
      return this.notValidNotificationExplanation !== '';
    },
    notValidNotificationExplanation (): string {
      const template = this.workingTopic.notificationText;

      if (!template) {
        return 'You need a going live notification.';
      }

      const generatedTitle = generateTitle({
        ...this.workingTopic,
        currentCounter: 100
      });

      const titleLength = generatedTitle.length;

      if (titleLength > 140) {
        return `A generated notification can be only 140 characters long. (Using 100 as counter) - Current Length: ${titleLength}`;
      }

      return '';
    }
  },
  methods: {
    cancel () {
      this.$emit('cancel');
    },
    save () {
      if (!this.workingTopic.title) {
        return;
      }

      if (this.isTemplateInvalid) {
        return;
      }

      this.$emit('save', this.workingTopic);
    },
    async importFromTwitch () {
      const channelInfo = await twitch.currentChannelInformation();
      const tags = await twitch.currentTags();

      if (!this.workingTopic.template) {
        this.workingTopic.template = channelInfo.title;
      }

      this.workingTopic.gameId = channelInfo.game_id;
      this.workingTopic.gameName = channelInfo.game_name;

      console.info({ channelInfo, tags });

      const importedTags = convertTwitchTagsToTagData(tags);

      console.info({ tags, importedTags });
      this.workingTopic.importTags = importedTags;

      this.currentTags = importedTags;
    },
    updateTagsFromTopic () {
      // topic was changed
      // set the current tags from the Topic
      console.info({
        topic: this.workingTopic,
        state: JSON.stringify(this.state.tags) ?? 'no null value',
        test: true
      });

      this.currentTags = this.workingTopic.tags
        ?.split(',')
        .map(id => this.state.tags[id])
        .filter(t => !!t) ?? [];

      this.updateTagsToTopic();
    },
    updateTags () {
      const tagsValue = (this.$refs as any).tagsInput.tags;

      this.currentTags = tagsValue;

      console.info(this.$refs);
      console.info('SHOULD BE UPDATED?!!?', this.currentTags);

      this.updateTagsToTopic();
    },
    updateTagsToTopic () {
      this.workingTopic.tags = this.currentTags.map(t => t.id).join(',');
    },
    addCommand () {
      this.workingTopic.commands.push({
        name: 'New Command',
        content: ''
      });
    },
    removeCommand (index: number) {
      this.workingTopic.commands.splice(index, 1);
    },
    archiveTopic () {
      this.workingTopic.archived = true;
      this.save();
    }
  },
  watch: {
    topic (val) {
      this.workingTopic = { ...val } as Topic;

      this.updateTagsFromTopic();
    }
  },
  mounted () {
    this.updateTagsFromTopic();
  }
})
</script>

<style lang="scss" scoped>
@import "~@voerro/vue-tagsinput/dist/style.css";

.topic-form-outer {
  height: 75vh;
  width: 100vw;
  max-width: 1000px;
}

.column:nth-of-type(2) {
  margin-left: 1rem;
}

.nes-field {
  margin-bottom: 1rem;

  .nes-text.is-error {
    display: block;
    margin-top: 1rem;
    margin-left: 0.5rem;
  }
}

.nes-textarea {
  min-height: 10rem;
}

.command_item {
  padding: 0.25rem;
  margin-bottom: 1rem;

  outline: 0.25rem dashed gray;

  input {
    display: inline-block;
    width: calc(100% - 5rem);
  }
  .nes-btn {
    margin-left: 1rem;
  }
  &:hover {
    background: gray;
    outline: none;
  }
}
</style>

<style lang="scss" >

.topic-form {
  margin-right: 1rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .tags-input-root {
    margin: 8px;

    .tags-input {
      border-radius: 0;
      margin-bottom: 0.5rem;
    }

    .tags-input-badge {
      margin-bottom: 0.5rem;
    }
  }
}
</style>
