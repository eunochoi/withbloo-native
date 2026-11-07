module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: process.env.WITHBLOO_ANDROID_DEV_CLIENT === '1'
      ? 'com.everstamp.dev'
      : config.android.package,
  },
});
