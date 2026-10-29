import groovy.json.JsonSlurper
import java.security.MessageDigest

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The model ships in the repo as chunks (models/toxic-bert). This step assembles it into
// the APK's assets and checks SHA3-512 at every stage. No network access.
val modelSource = rootProject.file("../models/toxic-bert")
val modelAssets = layout.buildDirectory.dir("generated/model-assets").get().asFile

fun sha3_512(f: File): String {
    val md = MessageDigest.getInstance("SHA3-512")
    f.inputStream().use { input ->
        val buf = ByteArray(1 shl 20)
        while (true) {
            val n = input.read(buf)
            if (n < 0) break
            md.update(buf, 0, n)
        }
    }
    return md.digest().joinToString("") { "%02x".format(it) }
}

val assembleModelAssets by tasks.registering {
    inputs.dir(modelSource)
    outputs.dir(modelAssets)
    doLast {
        @Suppress("UNCHECKED_CAST")
        val manifest = JsonSlurper().parse(File(modelSource, "manifest.json")) as Map<String, Any>
        check(manifest["algorithm"] == "sha3-512") { "manifest must use sha3-512" }
        @Suppress("UNCHECKED_CAST")
        val files = manifest["files"] as List<Map<String, Any>>
        modelAssets.mkdirs()
        for (entry in files) {
            val name = entry["name"] as String
            val dest = File(modelAssets, name)
            @Suppress("UNCHECKED_CAST")
            val chunks = (entry["chunks"] as? List<Map<String, Any>>) ?: emptyList()
            if (chunks.isEmpty()) {
                val src = File(modelSource, name)
                check(sha3_512(src) == entry["sha3_512"]) { "$name fails its SHA3-512 pin" }
                src.copyTo(dest, overwrite = true)
            } else {
                dest.outputStream().use { out ->
                    for (c in chunks) {
                        val src = File(modelSource, c["name"] as String)
                        check(sha3_512(src) == c["sha3_512"]) { "chunk ${c["name"]} fails its SHA3-512 pin" }
                        src.inputStream().use { it.copyTo(out) }
                    }
                }
            }
            check(sha3_512(dest) == entry["sha3_512"]) { "assembled $name fails its SHA3-512 pin" }
        }
    }
}

android {
    namespace = "ai.ghost9.clf"
    compileSdk = 34

    defaultConfig {
        applicationId = "ai.ghost9.clf"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0-spike"

        ndk {
            abiFilters.add("arm64-v8a")
        }
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(modelAssets)
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

tasks.named("preBuild") {
    dependsOn(assembleModelAssets)
}

dependencies {
    implementation("com.microsoft.onnxruntime:onnxruntime-android:1.31.1")
}
