<template>
  <div class="form-holder">
    <div class="nes-field">
      <label for="command_syntax"> Command Syntax </label>
      <input type="text" id="command_syntax" class="nes-input"
             autocomplete="off"
             v-model="commandSyntax">

      <div>
        <i>You need to use <code>{name}</code> and <code>{content}</code> to replace your commands. </i>
      </div>
    </div>

    <br />

    <div v-if="currentlyImportingTags">
      #{{ importedTags }} Tags imported.
    </div>

    <button v-if="isLoggedIn && !currentlyImportingTags" type="button"
            class="nes-btn" @click="importTwitchTags()">
      Import all Twitch Tags
    </button>

    <br/>

    <button type="button" class="nes-btn is-error" @click="cancel()">Cancel</button>
    <button type="button" class="nes-btn" @click="save()">Save</button>

  </div>
</template>

<script lang="ts">
import { store } from '../state';
import { CONFIG_COMMAND_SYNTAX, CONFIG_STATE, State, TwitchChannelTag, TwitchPaginatedDataResult } from '../types';
import { defineComponent } from 'vue';
import { twitch } from '@/twitch-instance';
import { convertTwitchTagsToTagData } from '@/utils';

export default defineComponent({
  data () {
    return {
      state: store.state as State,
      commandSyntax: '' as string,
      importedTags: 0,
      currentlyImportingTags: false
    }
  },
  mounted () {
    this.commandSyntax = CONFIG_STATE[CONFIG_COMMAND_SYNTAX];
  },
  computed: {
    isLoggedIn: () => {
      return store.state.loggedIn;
    }
  },
  methods: {
    cancel () {
      this.$emit('cancel');
    },
    save () {
      localStorage.setItem(CONFIG_COMMAND_SYNTAX, this.commandSyntax);
      CONFIG_STATE[CONFIG_COMMAND_SYNTAX] = this.commandSyntax;

      this.$emit('save');
    },
    async importTwitchTags () {
      this.currentlyImportingTags = true;

      let lastCursor = '';
      let result: TwitchPaginatedDataResult<TwitchChannelTag>;

      do {
        result = await twitch.listFirstTags(lastCursor);

        if (!result) {
          break;
        }

        console.info({ result });

        if (result.data.length) {
          const importableTags = convertTwitchTagsToTagData(result.data);

          const newTags = store.importUnknownTags(importableTags);

          if (newTags === 0) {
            break;
          }
        }

        lastCursor = result.pagination.cursor;
      } while (result.data.length !== 0);
    }
  }
});
</script>

<style scoped>

</style>
