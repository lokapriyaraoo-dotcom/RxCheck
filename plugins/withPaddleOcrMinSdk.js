const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withPaddleOcrMinSdk(config) {
  return withAppBuildGradle(config, config => {
    const source = config.modResults.contents;
    const target = /minSdkVersion\\s+rootProject\\.ext\\.minSdkVersion/;
    if (!target.test(source)) {
      throw new Error('RxCheck PaddleOCR requires Android minSdk 26; could not find the generated minSdkVersion setting.');
    }
    config.modResults.contents = source.replace(target, 'minSdkVersion 26');
    return config;
  });
};
