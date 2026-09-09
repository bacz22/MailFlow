package com.mailflow.infrastructure.config;

import com.mailflow.common.exception.AppException;
import com.mailflow.workspace.application.WorkspaceAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StompAuthChannelInterceptorTest {

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private WorkspaceAccessService workspaceAccessService;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private StompAuthChannelInterceptor interceptor;

    @Test
    void connect_withValidBearerToken_authenticatesUser() {
        UUID userId = UUID.randomUUID();
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer valid-token");
        accessor.setLeaveMutable(true);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Jwt jwt = new Jwt(
                "valid-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "none"),
                Map.of("sub", userId.toString())
        );
        when(jwtDecoder.decode("valid-token")).thenReturn(jwt);

        Message<?> result = interceptor.preSend(message, messageChannel);

        StompHeaderAccessor resAccessor = StompHeaderAccessor.wrap(result);
        Principal user = resAccessor.getUser();
        assertThat(user).isNotNull();
        assertThat(user.getName()).isEqualTo(userId.toString());
    }

    @Test
    void connect_missingToken_throwsException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    @Test
    void subscribe_toWorkspaceTopic_allowedWhenActiveMember() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/workspaces/" + workspaceId + "/notifications");
        accessor.setUser(new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);

        assertThat(result).isNotNull();
        verify(workspaceAccessService).requireActiveMember(userId, workspaceId);
    }

    @Test
    void subscribe_toWorkspaceTopic_forbiddenWhenNotMember() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/workspaces/" + workspaceId + "/notifications");
        accessor.setUser(new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        doThrow(new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Không có quyền"))
                .when(workspaceAccessService).requireActiveMember(userId, workspaceId);

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Bạn không có quyền nhận thông báo");
    }
}
