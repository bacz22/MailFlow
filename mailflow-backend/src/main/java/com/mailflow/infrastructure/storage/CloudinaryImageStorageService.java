package com.mailflow.infrastructure.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mailflow.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryImageStorageService implements ImageStorageService {

    private final CloudinaryProperties cloudinaryProperties;

    @Override
    public StoredImage uploadAvatar(UUID userId, byte[] content, String contentType) {
        if (!cloudinaryProperties.isConfigured()) {
            throw new AppException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AVATAR_STORAGE_UNAVAILABLE",
                    "Chưa cấu hình Cloudinary. Hãy đặt CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET."
            );
        }

        Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudinaryProperties.getCloudName(),
                "api_key", cloudinaryProperties.getApiKey(),
                "api_secret", cloudinaryProperties.getApiSecret(),
                "secure", true
        ));

        String publicId = cloudinaryProperties.getFolder() + "/" + userId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(content, ObjectUtils.asMap(
                    "public_id", publicId,
                    "overwrite", true,
                    "invalidate", true,
                    "resource_type", "image",
                    "unique_filename", false
            ));
            String url = (String) result.get("secure_url");
            String storedPublicId = (String) result.get("public_id");
            if (url == null || url.isBlank()) {
                throw new AppException(
                        HttpStatus.BAD_GATEWAY,
                        "AVATAR_UPLOAD_FAILED",
                        "Cloudinary không trả về URL ảnh."
                );
            }
            log.info("Đã tải avatar lên Cloudinary cho user [{}]", userId);
            return new StoredImage(url, storedPublicId != null ? storedPublicId : publicId);
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Cloudinary upload thất bại cho user [{}]: {}", userId, ex.getMessage());
            throw new AppException(
                    HttpStatus.BAD_GATEWAY,
                    "AVATAR_UPLOAD_FAILED",
                    "Không tải được ảnh lên Cloudinary. Vui lòng thử lại."
            );
        }
    }
}
