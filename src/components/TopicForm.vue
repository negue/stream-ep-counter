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

    <div v-if="workingTopic.gameName || workingTopic.tags">
      <br>
      Game: {{workingTopic.gameName}} <br />
      Tags: {{workingTopic.importTags ? workingTopic.importTags.map(t => t.name) :  workingTopic.tags?.split(',').map(id => state.tags[id]?.name)}}
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
      workingTopic: { ...this.topic } as Topic,
      counterPlaceholder: '{{counter}}',
      state: store.state
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
    }
  },
  watch: {
    topic (val) {
      this.workingTopic = { ...val } as Topic;
    }
  }
})
</script>

<style lang="scss" scoped>

</style>
