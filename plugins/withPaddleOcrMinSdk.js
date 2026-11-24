const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withPaddleOcrMinSdk(config) {
  return withAppBuildGradle(config, config => {
    let source = config.modResults.contents;

    // Match both Gradle forms: "minSdkVersion rootProject.ext.minSdkVersion"
    // and "minSdkVersion = rootProject.ext.minSdkVersion", tolerating whitespace.
    const minSdkPattern = /(\bminSdkVersion\s*(?:=\s*)?)rootProject\.ext\.minSdkVersion\b/;
    if (minSdkPattern.test(source)) {
      source = source.replace(minSdkPattern, '$1 26');
    } else if (!/\bminSdkVersion\s*(?:=\s*)?26\b/.test(source)) {
      throw new Error('RxCheck PaddleOCR requires Android minSdk 26; could not find the generated minSdkVersion setting.');
    }

    // Keep only ARM64 native libraries and enable release code/resource shrinking.
    if (!source.includes('abiFilters "arm64-v8a"')) {
      source += '\n\n// RxCheck release size optimization.\nandroid {\n  defaultConfig {\n    ndk {\n      abiFilters "arm64-v8a"\n    }\n  }\n  buildTypes {\n    release {\n      minifyEnabled true\n      shrinkResources true\n      proguardFiles getDefaultProguardFile(\'proguard-android-optimize.txt\'), \'proguard-rules.pro\'\n    }\n  }\n}\n';
    }
    config.modResults.contents = source;
    return config;
  });
};
