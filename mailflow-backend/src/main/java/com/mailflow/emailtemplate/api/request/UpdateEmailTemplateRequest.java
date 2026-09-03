package com.mailflow.emailtemplate.api.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmailTemplateRequest {

    @Size(max = 160, message = "Tên mẫu không vượt quá 160 ký tự.")
    private String name;

    @Size(max = 200, message = "Tiêu đề không vượt quá 200 ký tự.")
    private String subject;

    @Size(max = 200, message = "Preview text không vượt quá 200 ký tự.")
    private String previewText;

    @Size(max = 40)
    private String category;

    @Size(max = 20)
    private String status;

    private String htmlContent;

    @Size(max = 120, message = "Thumbnail không vượt quá 120 ký tự.")
    private String thumbnailGradient;

    @Size(max = 80, message = "Nhãn banner không vượt quá 80 ký tự.")
    private String bannerLabel;

    @Size(max = 200, message = "Tiêu đề banner không vượt quá 200 ký tự.")
    private String bannerTitle;
}
