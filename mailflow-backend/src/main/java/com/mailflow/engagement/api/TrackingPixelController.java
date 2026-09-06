package com.mailflow.engagement.api;

import com.mailflow.engagement.application.EngagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/t")
@RequiredArgsConstructor
public class TrackingPixelController {

    private static final byte[] TRANSPARENT_GIF = new byte[]{
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
            (byte) 0x80, 0x00, 0x00, (byte) 0xff, (byte) 0xff, (byte) 0xff,
            0x00, 0x00, 0x00, 0x21, (byte) 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
            0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
            0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    };

    private final EngagementService engagementService;

    @GetMapping(value = "/o/{token:.+}", produces = MediaType.IMAGE_GIF_VALUE)
    public ResponseEntity<byte[]> openPixel(@PathVariable("token") String token) {
        try {
            String raw = token.endsWith(".gif") ? token.substring(0, token.length() - 4) : token;
            engagementService.recordOpen(raw);
        } catch (Exception ignored) {
            // Always return pixel — never leak tracking failures to clients
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .contentType(MediaType.IMAGE_GIF)
                .body(TRANSPARENT_GIF);
    }

    @GetMapping("/c/{token:.+}")
    public ResponseEntity<Void> clickRedirect(
            @PathVariable("token") String token,
            @RequestParam("u") String targetUrl
    ) {
        String destination = "https://example.com";
        try {
            destination = engagementService.recordClickAndResolve(token, targetUrl);
        } catch (Exception ex) {
            destination = EngagementService.sanitizeRedirect(targetUrl);
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(destination))
                .build();
    }
}
