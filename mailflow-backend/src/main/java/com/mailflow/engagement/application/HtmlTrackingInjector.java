package com.mailflow.engagement.application;

import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class HtmlTrackingInjector {

    private static final Pattern ANCHOR_HREF = Pattern.compile(
            "(?i)(<a\\b[^>]*\\bhref\\s*=\\s*)([\"'])([^\"']+)\\2",
            Pattern.CASE_INSENSITIVE
    );

    private final PublicTrackingUrls trackingUrls;

    public HtmlTrackingInjector(PublicTrackingUrls trackingUrls) {
        this.trackingUrls = trackingUrls;
    }

    public String inject(
            String html,
            UUID workspaceId,
            UUID campaignId,
            UUID contactId,
            boolean openTracking,
            boolean clickTracking
    ) {
        String result = html == null ? "" : html;
        if (clickTracking) {
            result = rewriteLinks(result, workspaceId, campaignId, contactId);
        }
        if (openTracking) {
            result = appendPixel(result, workspaceId, campaignId, contactId);
        }
        return result;
    }

    private String rewriteLinks(String html, UUID workspaceId, UUID campaignId, UUID contactId) {
        Matcher matcher = ANCHOR_HREF.matcher(html);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String prefix = matcher.group(1);
            String quote = matcher.group(2);
            String href = matcher.group(3).trim();
            String lower = href.toLowerCase();
            if (lower.startsWith("http://") || lower.startsWith("https://")) {
                // Do not wrap unsubscribe / tracking URLs again
                if (!lower.contains("/t/unsubscribe") && !lower.contains("/t/c/") && !lower.contains("/t/o/")) {
                    href = trackingUrls.clickRedirectUrl(workspaceId, campaignId, contactId, href);
                }
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(prefix + quote + href + quote));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String appendPixel(String html, UUID workspaceId, UUID campaignId, UUID contactId) {
        // Avoid display:none — many clients skip loading hidden images (incl. open pixels).
        String pixel = "<img src=\""
                + trackingUrls.openPixelUrl(workspaceId, campaignId, contactId)
                + "\" width=\"1\" height=\"1\" alt=\"\" style=\"width:1px;height:1px;border:0;overflow:hidden;\" />";
        int bodyClose = html.toLowerCase().lastIndexOf("</body>");
        if (bodyClose >= 0) {
            return html.substring(0, bodyClose) + pixel + html.substring(bodyClose);
        }
        return html + pixel;
    }
}
