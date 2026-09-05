package com.mailflow.infrastructure.brevo;

import com.mailflow.common.exception.AppException;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.AuthenticateDomainResponse;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.AuthenticateOutcome;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.CreateDomainRequest;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.CreateDomainResponse;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.DomainSnapshot;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.GetDomainResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Locale;

@Slf4j
@Component
public class BrevoDomainClient {

    private final BrevoProperties properties;
    private final RestClient restClient;

    public BrevoDomainClient(BrevoProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .baseUrl(properties.getApiBaseUrl())
                .requestFactory(requestFactory)
                .requestInterceptor((request, body, execution) -> {
                    request.getHeaders().set("api-key", properties.getApiKey() == null ? "" : properties.getApiKey());
                    request.getHeaders().set("Accept", MediaType.APPLICATION_JSON_VALUE);
                    return execution.execute(request, body);
                })
                .build();
    }

    public void requireConfigured() {
        if (!properties.isConfigured()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "BREVO_NOT_CONFIGURED",
                    "Chưa cấu hình BREVO_API_KEY. Không thể đồng bộ tên miền với Brevo.");
        }
    }

    /**
     * Create domain on Brevo, or GET existing orphan domain when Brevo says it already exists.
     */
    public DomainSnapshot createOrFetchExisting(String domainName) {
        requireConfigured();
        try {
            CreateDomainResponse created = restClient.post()
                    .uri("/senders/domains")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new CreateDomainRequest(domainName))
                    .retrieve()
                    .body(CreateDomainResponse.class);
            if (created == null) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "BREVO_CREATE_FAILED",
                        "Brevo không trả về dữ liệu tên miền.");
            }
            return new DomainSnapshot(
                    created.getId(),
                    created.getDomainName() != null ? created.getDomainName() : domainName,
                    false,
                    created.getDnsRecords()
            );
        } catch (RestClientResponseException ex) {
            mapTransportErrors(ex);
            if (ex.getStatusCode().is4xxClientError() && looksLikeAlreadyExists(ex.getResponseBodyAsString())) {
                log.info("Brevo domain [{}] already exists — fetching details", domainName);
                return getDomain(domainName);
            }
            throw mapBrevoError(ex, "BREVO_CREATE_FAILED", "Không tạo được tên miền trên Brevo.");
        }
    }

    public DomainSnapshot getDomain(String domainName) {
        requireConfigured();
        try {
            GetDomainResponse got = restClient.get()
                    .uri("/senders/domains/{domainName}", domainName)
                    .retrieve()
                    .body(GetDomainResponse.class);
            if (got == null) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "BREVO_GET_FAILED",
                        "Brevo không trả về chi tiết tên miền.");
            }
            boolean authenticated = Boolean.TRUE.equals(got.getAuthenticated())
                    || Boolean.TRUE.equals(got.getVerified());
            return new DomainSnapshot(
                    got.getId(),
                    got.getDomain() != null ? got.getDomain() : domainName,
                    authenticated,
                    got.getDnsRecords()
            );
        } catch (RestClientResponseException ex) {
            mapTransportErrors(ex);
            throw mapBrevoError(ex, "BREVO_GET_FAILED", "Không lấy được tên miền từ Brevo.");
        }
    }

    public AuthenticateOutcome authenticateDomain(String domainName) {
        requireConfigured();
        try {
            restClient.put()
                    .uri("/senders/domains/{domainName}/authenticate", domainName)
                    .retrieve()
                    .body(AuthenticateDomainResponse.class);
            return AuthenticateOutcome.SUCCESS;
        } catch (RestClientResponseException ex) {
            mapTransportErrors(ex);
            if (ex.getStatusCode().value() == 400) {
                log.info("Brevo authenticate [{}] DNS not ready: {}", domainName, ex.getResponseBodyAsString());
                return AuthenticateOutcome.DNS_NOT_READY;
            }
            throw mapBrevoError(ex, "BREVO_AUTHENTICATE_FAILED", "Không xác thực được tên miền trên Brevo.");
        }
    }

    /** Idempotent: 404 treated as success. */
    public void deleteDomain(String domainName) {
        if (!properties.isConfigured()) {
            log.warn("BREVO_API_KEY missing — skip Brevo delete for [{}]", domainName);
            return;
        }
        try {
            restClient.delete()
                    .uri("/senders/domains/{domainName}", domainName)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                log.info("Brevo domain [{}] already absent (404)", domainName);
                return;
            }
            mapTransportErrors(ex);
            log.warn("Brevo delete domain [{}] failed: {} — continuing local delete",
                    domainName, ex.getResponseBodyAsString());
        }
    }

    private void mapTransportErrors(RestClientResponseException ex) {
        HttpStatusCode code = ex.getStatusCode();
        if (code.value() == 429) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS, "BREVO_RATE_LIMITED",
                    "Vui lòng đợi vài giây trước khi thử lại.");
        }
    }

    private static boolean looksLikeAlreadyExists(String body) {
        if (body == null || body.isBlank()) {
            return false;
        }
        String lower = body.toLowerCase(Locale.ROOT);
        return lower.contains("already") || lower.contains("exist") || lower.contains("duplicate");
    }

    private static AppException mapBrevoError(RestClientResponseException ex, String code, String fallback) {
        String detail = fallback;
        String body = ex.getResponseBodyAsString();
        if (body != null && !body.isBlank() && body.length() < 500) {
            detail = fallback + " (" + body + ")";
        }
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        if (ex.getStatusCode().is4xxClientError()) {
            status = HttpStatus.BAD_REQUEST;
        }
        return new AppException(status, code, detail);
    }
}
