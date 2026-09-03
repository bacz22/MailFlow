package com.mailflow.emailtemplate.application;

import org.springframework.web.util.HtmlUtils;

public final class EmailTemplateMerge {

    private EmailTemplateMerge() {
    }

    public static String applySubject(
            String source,
            String firstName,
            String lastName,
            String email,
            String company
    ) {
        return replaceTags(source, firstName, lastName, email, company, null, "", false);
    }

    public static String applyHtml(
            String source,
            String firstName,
            String lastName,
            String email,
            String company,
            String phone,
            String unsubscribeUrl
    ) {
        String unsub = (unsubscribeUrl == null || unsubscribeUrl.isBlank())
                ? "#"
                : unsubscribeUrl.trim();
        String unsubHtml = "<a href=\"" + escape(unsub)
                + "\" style=\"color:#2563eb;text-decoration:underline;\">hủy đăng ký tại đây (RFC 8058)</a>";
        return replaceTags(source, firstName, lastName, email, company, phone, unsubHtml, true);
    }

    private static String replaceTags(
            String source,
            String firstName,
            String lastName,
            String email,
            String company,
            String phone,
            String unsubscribeReplacement,
            boolean htmlEscape
    ) {
        if (source == null) {
            return "";
        }
        String fn = htmlEscape ? escape(firstName) : blankToEmpty(firstName);
        String ln = htmlEscape ? escape(lastName) : blankToEmpty(lastName);
        String em = htmlEscape ? escape(email) : blankToEmpty(email);
        String co = htmlEscape ? escape(company) : blankToEmpty(company);
        String ph = htmlEscape ? escape(phone) : blankToEmpty(phone);
        return source
                .replace("{{firstName}}", fn)
                .replace("{{lastName}}", ln)
                .replace("{{email}}", em)
                .replace("{{company}}", co)
                .replace("{{phone}}", ph)
                .replace("{{unsubscribeUrl}}", unsubscribeReplacement);
    }

    static String escape(String value) {
        String trimmed = blankToEmpty(value);
        if (trimmed.isEmpty()) {
            return "";
        }
        return HtmlUtils.htmlEscape(trimmed);
    }

    private static String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
