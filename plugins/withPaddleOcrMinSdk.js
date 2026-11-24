const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withPaddleOcrMinSdk(config) {
  return withAppBuildGradle(config, config => {
    let source = config.modResults.contents;
    const target = /minSdkVersion\s+rootProject\.ext\.minSdkVersion/;
    if (!target.test(source) && !/minSdkVersion\s+26/.test(source)) {
      throw new Error('RxCheck PaddleOCR requires Android minSdk 26; could not find the generated minSdkVersion setting.');
    }
    source = source.replace(target, 'minSdkVersion 26');

    // ONNX Runtime and OpenCV include large native binaries. Keep only the
    // ARM64 ABI in release builds; the production profile is an Android App Bundle.
    if (!source.includes('abiFilters "arm64-v8a"')) {
      source += \`

// RxCheck release size optimization.
android {
  defaultConfig {
    ndk {
      abiFilters "arm64-v8a"
    }
  }
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
\`;
    }
    config.modResults.contents = source;
    return config;
  });
};
