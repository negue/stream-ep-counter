<template>
  <div class="form-holder">
    <div class="nes-field">
      <label for="name_field"> Topic </label>
      <input type="text" id="name_field" class="nes-input"
             :class="{'is-error': !workingTopic.title}"
             :required="!workingTopic.title"
             autocomplete="off"
             v-model="workingTopic.title">
    </div>

    <div class="nes-field">
      <label for="counter_field">Counter</label>
      <input type="number" id="counter_field" class="nes-input"
             autocomplete="off"
      v-model="workingTopic.currentCounter">
    </div>

    <label for="textarea_field">Title-Template</label>
    <textarea id="textarea_field" class="nes-textarea"
              v-model="workingTopic.template"></textarea>

    <div v-if="!workingTopic.template?.includes('{{counter}}')">
      <i>You need to use <code>{{counterPlaceholder}}</code> as placeholder. </i>
    </div>

    <br>

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
    >
      <template v-slot:selected-tag="{ tag, index, removeTag }">
        {{tag.name}}
          <span class="is-danger" @click.prevent="removeTag(index)">X</span>

      </template>
    </tags-input>
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

    <br/>
    <br/>
    <button type="button" class="nes-btn is-error" @click="cancel()">Cancel</button>
    <button type="button" class="nes-btn" @click="save()">Save</button>

  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { TagData, Topic } from '@/types';
import { store } from '@/state';
import { twitch } from '@/twitch-instance';
import TagsInput from '@voerro/vue-tagsinput';

export default defineComponent({
  components: {
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
      state: store.state
    }
  },
  computed: {
    allTags (): TagData[] {
      const allTags = [...Object.values(this.state.tags)];

      if (this.workingTopic?.importTags) {
        allTags.push(...this.workingTopic.importTags);
      }

      return allTags;
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

      const importedTags = tags
        .filter((t: any) => !t.is_auto)
        .map((t: any) => ({
          id: t.tag_id,
          name: t.localization_names['en-us']
        }) as TagData);

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
        .filter(t => !!t);

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
</style>
