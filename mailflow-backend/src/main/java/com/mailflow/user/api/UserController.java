package com.mailflow.user.api;

import com.mailflow.user.api.request.ChangePasswordRequest;
import com.mailflow.user.api.request.UpdateProfileRequest;
import com.mailflow.user.api.response.CurrentUserResponse;
import com.mailflow.user.application.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getCurrentUser(UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/me")
    public ResponseEntity<CurrentUserResponse> updateMe(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(userService.updateCurrentUser(UUID.fromString(jwt.getSubject()), request));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<CurrentUserResponse> uploadAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(userService.updateAvatar(UUID.fromString(jwt.getSubject()), file));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(UUID.fromString(jwt.getSubject()), request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công."));
    }
}
