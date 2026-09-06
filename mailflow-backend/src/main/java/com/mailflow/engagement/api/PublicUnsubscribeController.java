package com.mailflow.engagement.api;

import com.mailflow.engagement.application.EngagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/t")
@RequiredArgsConstructor
public class PublicUnsubscribeController {

    private final EngagementService engagementService;

    @GetMapping(value = "/unsubscribe", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> unsubscribePage(@RequestParam("token") String token) {
        boolean ok;
        try {
            ok = engagementService.unsubscribe(token);
        } catch (IllegalArgumentException ex) {
            ok = false;
        }
        String title = ok ? "Đã hủy đăng ký" : "Liên kết không hợp lệ";
        String body = ok
                ? "Bạn đã hủy nhận email marketing từ workspace này. Bạn có thể đóng tab này."
                : "Token hủy đăng ký không hợp lệ hoặc đã hết hiệu lực.";
        return ResponseEntity.ok(html(title, body));
    }

    /** RFC 8058 one-click: mail clients POST to List-Unsubscribe URL. */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribePost(@RequestParam("token") String token) {
        return unsubscribeOneClick(token);
    }

    /** Alias path kept for explicit one-click links in HTML footers if needed. */
    @PostMapping("/unsubscribe/one-click")
    public ResponseEntity<Void> unsubscribeOneClick(@RequestParam("token") String token) {
        try {
            engagementService.unsubscribe(token);
        } catch (IllegalArgumentException ignored) {
            // Always 200 for one-click clients
        }
        return ResponseEntity.ok().build();
    }

    private static String html(String title, String message) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1"/>
                  <title>%s</title>
                  <style>
                    body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
                    .card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:420px;box-shadow:0 8px 24px rgba(15,23,42,.06)}
                    h1{font-size:20px;margin:0 0 12px}
                    p{font-size:14px;line-height:1.6;color:#475569;margin:0}
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h1>%s</h1>
                    <p>%s</p>
                  </div>
                </body>
                </html>
                """.formatted(title, title, message);
    }
}
