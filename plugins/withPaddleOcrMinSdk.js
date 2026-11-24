const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withPaddleOcrMinSdk(config) {
  return withAppBuildGradle(config, config => {
    let source = config.modResults.contents;
    const target = /minSdkVersion\s+rootProject\.ext\.minSdkVersion/;
    if (!target.test(source) && !/minSdkVersion\s+26/.test(source)) {
      throw new Error('RxCheck PaddleOCR requires Android minSdk 26; could not find the generated minSdkVersion setting.');
    }
    source = source.replace(target, 'minSdkVersion 26');

    // Keep only ARM64 native libraries and shrink the Android release build.
    if (!source.includes('abiFilters "arm64-v8a"')) {
      source += '\n\n// RxCheck release size optimization.\nandroid {\n  defaultConfig {\n    ndk {\n      abiFilters "arm64-v8a"\n    }\n  }\n  buildTypes {\n    release {\n      minifyEnabled true\n      shrinkResources true\n      proguardFiles getDefaultProguardFile(\'proguard-android-optimize.txt\'), \'proguard-rules.pro\'\n    }\n  }\n}\n';
    }
    config.modResults.contents = source;
    return config;
  });
};
