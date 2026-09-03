package com.mailflow.emailtemplate;

import com.mailflow.emailtemplate.application.EmailTemplateLayout;
import com.mailflow.emailtemplate.application.EmailTemplateMerge;
import com.mailflow.emailtemplate.domain.model.EmailTemplate;
import com.mailflow.emailtemplate.domain.model.EmailTemplateStatus;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateMergeTest {

    @Test
    void replacesKnownMergeTagsAndEscapesHtml() {
        String html = "<p>Hi {{firstName}} {{lastName}} at {{company}} ({{email}}) {{phone}} {{unsubscribeUrl}}</p>";
        String rendered = EmailTemplateMerge.applyHtml(
                html, "<script>", "Nguyen", "a@b.com", "Acme", "0912", "https://mailflow.vn/unsub");
        assertThat(rendered).contains("&lt;script&gt;");
        assertThat(rendered).doesNotContain("<script>");
        assertThat(rendered).contains("Nguyen");
        assertThat(rendered).contains("Acme");
        assertThat(rendered).contains("a@b.com");
        assertThat(rendered).contains("0912");
        assertThat(rendered).contains("href=\"https://mailflow.vn/unsub\"");
        assertThat(rendered).doesNotContain("{{unsubscribeUrl}}");
    }

    @Test
    void wrap_includesBannerAndBody() {
        EmailTemplate template = new EmailTemplate(
                UUID.randomUUID(), "Welcome", "Hi", null, "Onboarding",
                EmailTemplateStatus.DRAFT, "<p>x</p>",
                "bg-gradient-to-tr from-violet-600 to-purple-600",
                "MailFlow Communication123",
                "test mail",
                UUID.randomUUID()
        );
        String html = EmailTemplateLayout.wrap(template, "<p>Hello</p>");
        assertThat(html).contains("MailFlow Communication123");
        assertThat(html).contains("test mail");
        assertThat(html).contains("<p>Hello</p>");
        assertThat(html).contains("#7c3aed");
        assertThat(html).contains("Truy Cập Nền Tảng");
    }
}
