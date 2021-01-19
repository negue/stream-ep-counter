<template>
  <div class="form-holder topic-form">
    <div class="nes-field">
      <label for="command_syntax"> Command Syntax </label>
      <input type="text" id="command_syntax" class="nes-input"
             autocomplete="off"
             v-model="commandSyntax">

      <div>
        <i>You need to use <code>{name}</code> and <code>{content}</code> to replace your commands. </i>
      </div>
    </div>

    <br/>

    <button type="button" class="nes-btn is-error" @click="cancel()">Cancel</button>
    <button type="button" class="nes-btn" @click="save()">Save</button>

  </div>
</template>

<script lang="ts">
import { store } from '../state';
import { CONFIG_COMMAND_SYNTAX, CONFIG_STATE, State } from '../types';
import { defineComponent } from 'vue';

export default defineComponent({
  data () {
    return {
      state: store.state as State,
      commandSyntax: '' as string
    }
  },
  mounted () {
    this.commandSyntax = CONFIG_STATE[CONFIG_COMMAND_SYNTAX];
  },
  computed: {

  },
  methods: {
    cancel () {
      this.$emit('cancel');
    },
    save () {
      localStorage.setItem(CONFIG_COMMAND_SYNTAX, this.commandSyntax);
      CONFIG_STATE[CONFIG_COMMAND_SYNTAX] = this.commandSyntax;

      this.$emit('save');
    }
  }
});
</script>

<style scoped>

</style>
