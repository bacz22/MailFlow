package com.mailflow.infrastructure.brevo;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Normalized Brevo domain + DNS records (create and get responses differ slightly in field names).
 */
public final class BrevoDomainDtos {

    private BrevoDomainDtos() {
    }

    public record CreateDomainRequest(String name) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateDomainResponse {
        private String id;
        @JsonProperty("domain_name")
        private String domainName;
        private String message;
        @JsonProperty("dns_records")
        private DnsRecords dnsRecords;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getDomainName() {
            return domainName;
        }

        public void setDomainName(String domainName) {
            this.domainName = domainName;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public DnsRecords getDnsRecords() {
            return dnsRecords;
        }

        public void setDnsRecords(DnsRecords dnsRecords) {
            this.dnsRecords = dnsRecords;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GetDomainResponse {
        private String id;
        private String domain;
        private Boolean verified;
        private Boolean authenticated;
        @JsonProperty("dns_records")
        private DnsRecords dnsRecords;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getDomain() {
            return domain;
        }

        public void setDomain(String domain) {
            this.domain = domain;
        }

        public Boolean getVerified() {
            return verified;
        }

        public void setVerified(Boolean verified) {
            this.verified = verified;
        }

        public Boolean getAuthenticated() {
            return authenticated;
        }

        public void setAuthenticated(Boolean authenticated) {
            this.authenticated = authenticated;
        }

        public DnsRecords getDnsRecords() {
            return dnsRecords;
        }

        public void setDnsRecords(DnsRecords dnsRecords) {
            this.dnsRecords = dnsRecords;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AuthenticateDomainResponse {
        @JsonProperty("domain_name")
        private String domainName;
        private String message;

        public String getDomainName() {
            return domainName;
        }

        public void setDomainName(String domainName) {
            this.domainName = domainName;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DnsRecords {
        @JsonProperty("brevo_code")
        private DnsRecordItem brevoCode;
        @JsonProperty("dkim_record")
        private DnsRecordItem dkimRecord;
        @JsonProperty("dkim1Record")
        @JsonAlias({"dkim_1_record", "dkim1_record"})
        private DnsRecordItem dkim1Record;
        @JsonProperty("dkim2Record")
        @JsonAlias({"dkim_2_record", "dkim2_record"})
        private DnsRecordItem dkim2Record;
        @JsonProperty("dmarc_record")
        private DnsRecordItem dmarcRecord;

        public DnsRecordItem getBrevoCode() {
            return brevoCode;
        }

        public void setBrevoCode(DnsRecordItem brevoCode) {
            this.brevoCode = brevoCode;
        }

        public DnsRecordItem getDkimRecord() {
            return dkimRecord;
        }

        public void setDkimRecord(DnsRecordItem dkimRecord) {
            this.dkimRecord = dkimRecord;
        }

        public DnsRecordItem getDkim1Record() {
            return dkim1Record;
        }

        public void setDkim1Record(DnsRecordItem dkim1Record) {
            this.dkim1Record = dkim1Record;
        }

        public DnsRecordItem getDkim2Record() {
            return dkim2Record;
        }

        public void setDkim2Record(DnsRecordItem dkim2Record) {
            this.dkim2Record = dkim2Record;
        }

        public DnsRecordItem getDmarcRecord() {
            return dmarcRecord;
        }

        public void setDmarcRecord(DnsRecordItem dmarcRecord) {
            this.dmarcRecord = dmarcRecord;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DnsRecordItem {
        @JsonProperty("host_name")
        private String hostName;
        private String type;
        private String value;
        private Boolean status;

        public String getHostName() {
            return hostName;
        }

        public void setHostName(String hostName) {
            this.hostName = hostName;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public Boolean getStatus() {
            return status;
        }

        public void setStatus(Boolean status) {
            this.status = status;
        }
    }

    /** Internal snapshot after create/get. */
    public record DomainSnapshot(
            String brevoDomainId,
            String domainName,
            boolean authenticated,
            DnsRecords dnsRecords
    ) {
    }

    public enum AuthenticateOutcome {
        SUCCESS,
        DNS_NOT_READY
    }
}
