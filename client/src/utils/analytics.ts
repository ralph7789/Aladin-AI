import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.VITE_MIXPANEL_TOKEN;
if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, { debug: process.env.NODE_ENV !== 'production' });
}

export const trackEvent = (eventName: string, props?: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track(eventName, props);
  }
};
