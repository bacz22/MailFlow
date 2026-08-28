package com.mailflow.user;

import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.infrastructure.storage.ImageStorageService;
import com.mailflow.infrastructure.storage.ImageStorageService.StoredImage;
import com.mailflow.user.api.request.UpdateProfileRequest;
import com.mailflow.user.api.response.CurrentUserResponse;
import com.mailflow.user.application.UserService;
import com.mailflow.user.domain.model.Role;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.user.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImageStorageService imageStorageService;

    @InjectMocks
    private UserService userService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User("an.nguyen@mailflow.dev", "hashed", "An", "Nguyen Van");
        user.setId(userId);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(Instant.now());
        user.addRole(new Role("ROLE_OWNER", "Owner"));
    }

    @Test
    @DisplayName("GET me theo sub -> trả hồ sơ, roles, emailVerified")
    void getCurrentUser_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        CurrentUserResponse response = userService.getCurrentUser(userId);

        assertThat(response.getId()).isEqualTo(userId);
        assertThat(response.getEmail()).isEqualTo("an.nguyen@mailflow.dev");
        assertThat(response.getFirstName()).isEqualTo("An");
        assertThat(response.getLastName()).isEqualTo("Nguyen Van");
        assertThat(response.isEmailVerified()).isTrue();
        assertThat(response.getRoles()).containsExactly("ROLE_OWNER");
        assertThat(response.getPhone()).isNull();
        assertThat(response.getJobTitle()).isNull();
    }

    @Test
    @DisplayName("GET me khi user không tồn tại -> 404")
    void getCurrentUser_missing_throwsNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUser(userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasFieldOrPropertyWithValue("code", "RESOURCE_NOT_FOUND");
    }

    @Test
    @DisplayName("PATCH me cập nhật họ tên, SĐT, chức danh; email không đổi")
    void updateCurrentUser_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("  Binh  ")
                .lastName("Tran")
                .phone(" +84 912 345 678 ")
                .jobTitle(" Marketing Ops ")
                .build();

        CurrentUserResponse response = userService.updateCurrentUser(userId, request);

        assertThat(response.getFirstName()).isEqualTo("Binh");
        assertThat(response.getLastName()).isEqualTo("Tran");
        assertThat(response.getPhone()).isEqualTo("+84 912 345 678");
        assertThat(response.getJobTitle()).isEqualTo("Marketing Ops");
        assertThat(response.getEmail()).isEqualTo("an.nguyen@mailflow.dev");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("PATCH me phone/jobTitle trống -> lưu null")
    void updateCurrentUser_blankOptionalFields_becomeNull() {
        user.setPhone("+84912");
        user.setJobTitle("Old title");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("An")
                .lastName("Nguyen Van")
                .phone("  ")
                .jobTitle("")
                .build();

        CurrentUserResponse response = userService.updateCurrentUser(userId, request);

        assertThat(response.getPhone()).isNull();
        assertThat(response.getJobTitle()).isNull();
    }

    @Test
    @DisplayName("PATCH me khi user không tồn tại -> 404, không save")
    void updateCurrentUser_missing_throwsNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("An")
                .lastName("Nguyen")
                .build();

        assertThatThrownBy(() -> userService.updateCurrentUser(userId, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("POST avatar JPG hợp lệ -> lưu URL Cloudinary")
    void updateAvatar_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(imageStorageService.uploadAvatar(eq(userId), any(byte[].class), eq("image/jpeg")))
                .thenReturn(new StoredImage("https://res.cloudinary.com/demo/image/upload/v1/mailflow/avatars/" + userId, "mailflow/avatars/" + userId));

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", new byte[] {1, 2, 3});

        CurrentUserResponse response = userService.updateAvatar(userId, file);

        assertThat(response.getAvatarUrl()).startsWith("https://res.cloudinary.com/");
        verify(imageStorageService).uploadAvatar(eq(userId), any(byte[].class), eq("image/jpeg"));
    }

    @Test
    @DisplayName("POST avatar không phải ảnh -> AVATAR_TYPE_INVALID")
    void updateAvatar_rejectsNonImage() {
        MockMultipartFile file = new MockMultipartFile("file", "note.txt", "text/plain", new byte[] {1});

        assertThatThrownBy(() -> userService.updateAvatar(userId, file))
                .isInstanceOf(com.mailflow.common.exception.AppException.class)
                .hasFieldOrPropertyWithValue("code", "AVATAR_TYPE_INVALID");

        verify(imageStorageService, never()).uploadAvatar(any(), any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("POST avatar quá 2MB -> AVATAR_TOO_LARGE")
    void updateAvatar_rejectsTooLarge() {
        byte[] huge = new byte[(int) (2 * 1024 * 1024) + 1];
        MockMultipartFile file = new MockMultipartFile("file", "big.jpg", "image/jpeg", huge);

        assertThatThrownBy(() -> userService.updateAvatar(userId, file))
                .isInstanceOf(com.mailflow.common.exception.AppException.class)
                .hasFieldOrPropertyWithValue("code", "AVATAR_TOO_LARGE");

        verify(imageStorageService, never()).uploadAvatar(any(), any(), any());
    }
}
