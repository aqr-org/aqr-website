import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';
import components from './storyblokComponents';

export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN,
  use: [apiPlugin],
  components,
  apiOptions: {
    region: 'eu',
  },
  bridge: true,
});