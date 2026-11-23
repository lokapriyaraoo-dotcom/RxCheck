package com.rxcheck.paddleocr

import android.net.Uri
import com.paddle.ocr.EngineConfig
import com.paddle.ocr.PaddleOCR
import com.paddle.ocr.PaddleOCRConfig
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import java.io.File

class RxCheckPaddleOcrModule : Module() {
  private var paddleOcr: PaddleOCR? = null

  override fun definition() = ModuleDefinition {
    Name("RxCheckPaddleOcr")

    AsyncFunction("recognize") { imageUri: String ->
      // Expo AsyncFunction is not itself a Kotlin suspend lambda. Bridge the
      // SDK's suspend API on an IO dispatcher so model loading and inference
      // never run on Android's main thread.
      runBlocking(Dispatchers.IO) {
        val context = appContext.reactContext
          ?: throw IllegalStateException("Android context is unavailable")
        val uri = Uri.parse(imageUri)
        val bytes = when (uri.scheme) {
          "file" -> File(uri.path ?: throw IllegalArgumentException("Invalid image path")).readBytes()
          "content" -> context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalArgumentException("Cannot open selected image")
          else -> throw IllegalArgumentException("Only local file and content URIs are supported")
        }
        if (bytes.isEmpty()) throw IllegalArgumentException("Selected image is empty")
        // PaddleOCR's Android SDK requires the OpenCV JNI library to be loaded
        // explicitly before model creation. OpenCVLoader.initDebug() can return
        // false with the QuickBird Gradle AAR even when the JNI library is packaged.
        try {
          System.loadLibrary("opencv_java4")
        } catch (error: UnsatisfiedLinkError) {
          throw IllegalStateException(
            "OpenCV native library could not be loaded. Check that the APK includes libopencv_java4.so for this device ABI.",
            error
          )
        }

        val ocr = paddleOcr ?: PaddleOCR.create(
          context = context,
          config = PaddleOCRConfig(recScoreThresh = 0.0f, recBatchSize = 1),
          engineConfig = EngineConfig(numThreads = 4),
          detModelAssetPath = "models/det/inference.onnx",
          recModelAssetPath = "models/rec/inference.onnx",
          recConfigAssetPath = "models/rec/inference.yml"
        ).also { paddleOcr = it }

        val result = ocr.recognize(bytes)
        val lines = result.results.map { it.text.trim() }.filter { it.isNotEmpty() }
        mapOf(
          "text" to lines.joinToString("\n"),
          "lines" to lines,
          "confidences" to result.results.map { it.confidence.toDouble() },
          "engine" to "PaddleOCR PP-OCRv5 mobile (experimental, on-device)",
          "warning" to "Handwriting OCR is experimental. Verify every medicine name, strength, dose, decimal, unit and instruction against the original prescription."
        )
      }
    }
  }
}
