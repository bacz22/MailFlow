package com.mailflow.user;

import com.mailflow.user.api.UserController;
import com.mailflow.user.api.request.UpdateProfileRequest;
import com.mailflow.user.api.response.CurrentUserResponse;
import com.mailflow.user.application.UserService;
import com.mailflow.user.domain.model.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @Test
    @DisplayName("GET /users/me đọc sub từ JWT")
    void getMe_usesJwtSubject() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = jwtWithSubject(userId);
        CurrentUserResponse body = CurrentUserResponse.builder()
                .id(userId)
                .email("an.nguyen@mailflow.dev")
                .firstName("An")
                .lastName("Nguyen Van")
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .roles(Set.of("ROLE_OWNER"))
                .build();
        when(userService.getCurrentUser(userId)).thenReturn(body);

        ResponseEntity<CurrentUserResponse> response = userController.getMe(jwt);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isSameAs(body);
        verify(userService).getCurrentUser(userId);
    }

    @Test
    @DisplayName("PATCH /users/me cập nhật theo sub")
    void updateMe_usesJwtSubject() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = jwtWithSubject(userId);
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Binh")
                .lastName("Tran")
                .phone("+84912345678")
                .jobTitle("Ops")
                .build();
        CurrentUserResponse body = CurrentUserResponse.builder()
                .id(userId)
                .firstName("Binh")
                .lastName("Tran")
                .phone("+84912345678")
                .jobTitle("Ops")
                .build();
        when(userService.updateCurrentUser(userId, request)).thenReturn(body);

        ResponseEntity<CurrentUserResponse> response = userController.updateMe(jwt, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isSameAs(body);
        verify(userService).updateCurrentUser(userId, request);
    }

    @Test
    @DisplayName("POST /users/me/avatar đọc sub từ JWT")
    void uploadAvatar_usesJwtSubject() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = jwtWithSubject(userId);
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[] {1});
        CurrentUserResponse body = CurrentUserResponse.builder()
                .id(userId)
                .avatarUrl("https://res.cloudinary.com/demo/image/upload/avatar.jpg")
                .build();
        when(userService.updateAvatar(userId, file)).thenReturn(body);

        ResponseEntity<CurrentUserResponse> response = userController.uploadAvatar(jwt, file);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isSameAs(body);
        verify(userService).updateAvatar(userId, file);
    }

    private static Jwt jwtWithSubject(UUID userId) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(userId.toString())
                .build();
    }
}
