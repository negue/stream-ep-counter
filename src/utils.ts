import {
  Command,
  COMMAND_SYNTAX_CONTENT,
  COMMAND_SYNTAX_NAME,
  CONFIG_COMMAND_SYNTAX,
  CONFIG_STATE,
  Topic
} from '@/types';

export function generateTitle (topic: Topic) {
  if (!topic || !topic.template) {
    return '';
  }

  return topic.template.replace(/{{counter}}/g, `${topic.currentCounter}`);
}

export function generateNotification (topic: Topic) {
  if (!topic || !topic.notificationText) {
    return '';
  }

  return topic.notificationText.replace(/{{counter}}/g, `${topic.currentCounter}`);
}

export function generateCommandText (command: Command) {
  const commandToSend = CONFIG_STATE[CONFIG_COMMAND_SYNTAX]
    .replace(COMMAND_SYNTAX_NAME, command.name)
    .replace(COMMAND_SYNTAX_CONTENT, command.content);

  return commandToSend;
}
