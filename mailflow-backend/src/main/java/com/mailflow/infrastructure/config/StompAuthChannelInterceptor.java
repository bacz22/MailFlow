package com.mailflow.infrastructure.config;

import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final WorkspaceAccessService workspaceAccessService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || authHeader.isBlank()) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AuthenticationCredentialsNotFoundException("Thiếu token xác thực WebSocket.");
        }

        String token = authHeader.substring(7).trim();
        try {
            Jwt jwt = jwtDecoder.decode(token);
            String subject = jwt.getSubject();
            UUID userId = UUID.fromString(subject);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userId.toString(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );
            accessor.setUser(auth);
            log.debug("STOMP CONNECT authenticated user={}", userId);
        } catch (Exception ex) {
            log.warn("STOMP CONNECT invalid JWT token: {}", ex.getMessage());
            throw new AuthenticationCredentialsNotFoundException("Token WebSocket không hợp lệ: " + ex.getMessage());
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/topic/workspaces/")) {
            return;
        }

        Principal principal = accessor.getUser();
        if (principal == null) {
            throw new AccessDeniedException("Chưa xác thực người dùng khi đăng ký topic.");
        }

        UUID userId;
        try {
            userId = UUID.fromString(principal.getName());
        } catch (IllegalArgumentException ex) {
            throw new AccessDeniedException("User ID không hợp lệ.");
        }

        String subPath = destination.substring("/topic/workspaces/".length());
        int slashIdx = subPath.indexOf('/');
        String workspaceIdStr = (slashIdx > 0) ? subPath.substring(0, slashIdx) : subPath;

        UUID workspaceId;
        try {
            workspaceId = UUID.fromString(workspaceIdStr);
        } catch (IllegalArgumentException ex) {
            log.warn("STOMP SUBSCRIBE malformed workspace ID in destination={}", destination);
            throw new AccessDeniedException("Workspace ID không hợp lệ trong topic: " + destination);
        }

        try {
            workspaceAccessService.requireActiveMember(userId, workspaceId);
            log.debug("STOMP SUBSCRIBE authorized user={} to workspace={}", userId, workspaceId);
        } catch (Exception ex) {
            log.warn("STOMP SUBSCRIBE forbidden user={} to workspace={}: {}", userId, workspaceId, ex.getMessage());
            throw new AccessDeniedException("Bạn không có quyền nhận thông báo của workspace này: " + workspaceId);
        }
    }
}
