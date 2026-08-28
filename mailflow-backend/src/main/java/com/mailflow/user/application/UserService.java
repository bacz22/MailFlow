package com.mailflow.user.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.infrastructure.storage.ImageStorageService;
import com.mailflow.infrastructure.storage.ImageStorageService.StoredImage;
import com.mailflow.user.api.request.ChangePasswordRequest;
import com.mailflow.user.api.request.UpdateProfileRequest;
import com.mailflow.user.api.response.CurrentUserResponse;
import com.mailflow.user.domain.model.Role;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final long MAX_AVATAR_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) {
        return toResponse(requireUser(userId));
    }

    @Transactional
    public CurrentUserResponse updateCurrentUser(UUID userId, UpdateProfileRequest request) {
        User user = requireUser(userId);
        user.updateProfile(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                blankToNull(request.getPhone()),
                blankToNull(request.getJobTitle())
        );
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public CurrentUserResponse updateAvatar(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "AVATAR_REQUIRED", "Vui lòng chọn ảnh đại diện.");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new AppException(HttpStatus.BAD_REQUEST, "AVATAR_TOO_LARGE", "Ảnh đại diện tối đa 2MB.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_AVATAR_TYPES.contains(contentType)) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "AVATAR_TYPE_INVALID",
                    "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP."
            );
        }

        User user = requireUser(userId);
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "AVATAR_UNREADABLE", "Không đọc được file ảnh.");
        }

        StoredImage stored = imageStorageService.uploadAvatar(userId, content, contentType);
        user.updateAvatar(stored.url(), stored.publicId());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "PASSWORD_MISMATCH",
                    "Mật khẩu xác nhận không khớp với mật khẩu mới."
            );
        }

        User user = requireUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CURRENT_PASSWORD",
                    "Mật khẩu hiện tại không chính xác."
            );
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "NEW_PASSWORD_SAME_AS_OLD",
                    "Mật khẩu mới không được trùng với mật khẩu cũ."
            );
        }

        user.updatePassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId.toString()));
    }

    private static CurrentUserResponse toResponse(User user) {
        Set<String> roles = user.getRoles() == null
                ? Set.of()
                : user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return CurrentUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .status(user.getStatus())
                .phone(user.getPhone())
                .jobTitle(user.getJobTitle())
                .avatarUrl(user.getAvatarUrl())
                .emailVerified(user.isEmailVerified())
                .twoFactorEnabled(user.isTwoFactorEnabled())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
