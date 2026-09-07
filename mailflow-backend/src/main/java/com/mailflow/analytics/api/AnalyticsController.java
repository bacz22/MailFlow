package com.mailflow.analytics.api;

import com.mailflow.analytics.api.response.AnalyticsOverviewResponse;
import com.mailflow.analytics.api.response.AnalyticsTimeseriesResponse;
import com.mailflow.analytics.api.response.CampaignAnalyticsRowResponse;
import com.mailflow.analytics.api.response.CampaignReportResponse;
import com.mailflow.analytics.api.response.EngagementEventResponse;
import com.mailflow.analytics.application.AnalyticsService;
import com.mailflow.analytics.application.ReportExportService;
import com.mailflow.workspace.application.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AnalyticsController {

    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final AnalyticsService analyticsService;
    private final ReportExportService reportExportService;

    @GetMapping("/analytics/overview")
    public ResponseEntity<AnalyticsOverviewResponse> overview(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ResponseEntity.ok(analyticsService.overview(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                from,
                to
        ));
    }

    @GetMapping("/analytics/timeseries")
    public ResponseEntity<AnalyticsTimeseriesResponse> timeseries(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ResponseEntity.ok(analyticsService.timeseries(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                from,
                to
        ));
    }

    @GetMapping("/analytics/campaigns")
    public ResponseEntity<List<CampaignAnalyticsRowResponse>> campaigns(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ResponseEntity.ok(analyticsService.campaigns(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                from,
                to
        ));
    }

    @GetMapping("/campaigns/{campaignId}/report")
    public ResponseEntity<CampaignReportResponse> campaignReport(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId
    ) {
        return ResponseEntity.ok(analyticsService.campaignReport(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId
        ));
    }

    @GetMapping("/campaigns/{campaignId}/report/export")
    public ResponseEntity<ByteArrayResource> exportCampaignReport(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UUID workspaceId = WorkspaceService.requireCurrentWorkspaceId(jwt);
        byte[] bytes = reportExportService.exportCampaignReportXlsx(userId, workspaceId, campaignId);
        String filename = "campaign-report-" + campaignId + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(XLSX)
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/analytics/export")
    public ResponseEntity<ByteArrayResource> exportAnalytics(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UUID workspaceId = WorkspaceService.requireCurrentWorkspaceId(jwt);
        byte[] bytes = reportExportService.exportAnalyticsXlsx(userId, workspaceId, from, to);
        String day = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
        String filename = "analytics-" + day + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(XLSX)
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/campaigns/{campaignId}/engagements")
    public ResponseEntity<Map<String, Object>> campaignEngagements(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<EngagementEventResponse> result = analyticsService.campaignEngagements(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId,
                type,
                page,
                size
        );
        return ResponseEntity.ok(pagePayload(result));
    }

    @GetMapping("/contacts/{contactId}/engagements")
    public ResponseEntity<Map<String, Object>> contactEngagements(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID contactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<EngagementEventResponse> result = analyticsService.contactEngagements(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                contactId,
                page,
                size
        );
        return ResponseEntity.ok(pagePayload(result));
    }

    private static Map<String, Object> pagePayload(Page<EngagementEventResponse> page) {
        return Map.of(
                "content", page.getContent(),
                "page", page.getNumber(),
                "size", page.getSize(),
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages()
        );
    }
}
