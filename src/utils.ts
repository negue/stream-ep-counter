import { Topic } from '@/types';

export function generateTitle (topic: Topic) {
  if (!topic || !topic.template) {
    return '';
  }

  return topic.template.replace(/{{counter}}/g, `${topic.currentCounter}`);
}
