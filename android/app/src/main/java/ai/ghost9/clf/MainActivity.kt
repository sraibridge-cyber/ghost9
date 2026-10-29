package ai.ghost9.clf

import android.app.Activity
import android.os.Bundle
import android.widget.TextView

class MainActivity : Activity() {
    private var server: ClfServer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        server = ClfServer().also { it.start() }
        val view = TextView(this).apply {
            text = "Ghost9 classifier shell\n" +
                "GET http://127.0.0.1:7768/health\n" +
                "Status: spike. Scoring not wired yet."
            setPadding(48, 48, 48, 48)
        }
        setContentView(view)
    }

    override fun onDestroy() {
        server?.stop()
        super.onDestroy()
    }
}
