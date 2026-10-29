package ai.ghost9.clf

import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import kotlin.concurrent.thread

// Implements the loopback part of docs/architecture/CLF_SCORE_CONTRACT.md.
// Spike state: /health is real, /score answers 501 until the tokenizer and the
// onnxruntime session are ported. Bind is loopback only, as the contract requires.
class ClfServer(private val port: Int = 7768) {
    @Volatile private var running = false
    private var serverSocket: ServerSocket? = null

    fun start() {
        val socket = ServerSocket(port, 16, InetAddress.getByName("127.0.0.1"))
        serverSocket = socket
        running = true
        thread(name = "clf-accept", isDaemon = true) {
            while (running) {
                try {
                    val client = socket.accept()
                    thread(isDaemon = true) { handle(client) }
                } catch (e: Exception) {
                    if (!running) break
                }
            }
        }
    }

    fun stop() {
        running = false
        serverSocket?.close()
    }

    private fun handle(sock: Socket) {
        sock.use { s ->
            val reader = BufferedReader(InputStreamReader(s.getInputStream(), Charsets.UTF_8))
            val requestLine = reader.readLine() ?: return
            val parts = requestLine.split(" ")
            val method = parts.getOrNull(0) ?: ""
            val path = parts.getOrNull(1) ?: ""

            var contentLength = 0
            while (true) {
                val line = reader.readLine() ?: break
                if (line.isEmpty()) break
                if (line.lowercase().startsWith("content-length:")) {
                    contentLength = line.substringAfter(":").trim().toIntOrNull() ?: 0
                }
            }
            if (contentLength > 0) {
                val buf = CharArray(contentLength)
                var read = 0
                while (read < contentLength) {
                    val n = reader.read(buf, read, contentLength - read)
                    if (n < 0) break
                    read += n
                }
            }

            val (status, body) = when {
                method == "GET" && path == "/health" ->
                    200 to "{\"ok\":true,\"model\":\"$MODEL_ID\",\"status\":\"spike\"}"
                method == "POST" && path == "/score" ->
                    501 to "{\"error\":\"scoring not wired in the spike\"}"
                else -> 404 to "{\"error\":\"not found\"}"
            }
            val bytes = body.toByteArray(Charsets.UTF_8)
            val header = "HTTP/1.1 $status ${reason(status)}\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: ${bytes.size}\r\n" +
                "Connection: close\r\n\r\n"
            s.getOutputStream().apply {
                write(header.toByteArray(Charsets.UTF_8))
                write(bytes)
                flush()
            }
        }
    }

    private fun reason(status: Int): String = when (status) {
        200 -> "OK"
        404 -> "Not Found"
        501 -> "Not Implemented"
        else -> "Error"
    }

    companion object {
        const val MODEL_ID = "Xenova/toxic-bert@65cbc2607cb7fad64f98d1e8a5a3d1f8577895fd"
    }
}
