package com.mailflow.infrastructure.storage;

import java.util.UUID;

public interface ImageStorageService {

    StoredImage uploadAvatar(UUID userId, byte[] content, String contentType);

    record StoredImage(String url, String publicId) {
    }
}
