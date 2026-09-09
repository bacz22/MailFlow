package com.mailflow.workspace.application;

import com.mailflow.auth.infrastructure.jwt.AccessTokenService;
import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.infrastructure.storage.ImageStorageService;
import com.mailflow.infrastructure.storage.ImageStorageService.StoredImage;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
import com.mailflow.notification.application.event.NotificationEvents;
import com.mailflow.workspace.api.request.CreateWorkspaceRequest;
import com.mailflow.workspace.api.request.InviteMemberRequest;
import com.mailflow.workspace.api.request.UpdateMemberRoleRequest;
import com.mailflow.workspace.api.request.UpdateWorkspaceRequest;
import com.mailflow.workspace.api.response.SwitchWorkspaceResponse;
import com.mailflow.workspace.api.response.WorkspaceMemberResponse;
import com.mailflow.workspace.api.response.WorkspaceSettingsResponse;
import com.mailflow.workspace.api.response.WorkspaceSummaryResponse;
import com.mailflow.workspace.application.event.WorkspaceMemberInvitedEvent;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.model.WorkspaceInvitation;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceMemberStatus;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import com.mailflow.workspace.domain.repository.WorkspaceInvitationRepository;
import com.mailflow.workspace.domain.repository.WorkspaceMemberRepository;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private static final long INVITE_TTL_DAYS = 7;
    private static final String PLAN_FREE = "Free";
    private static final long MAX_LOGO_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_LOGO_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml"
    );

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final WorkspaceAccessService accessService;
    private final WorkspaceBootstrapService bootstrapService;
    private final AccessTokenService accessTokenService;
    private final JwtProperties jwtProperties;
    private final SecureTokenGenerator tokenGenerator;
    private final ApplicationEventPublisher eventPublisher;
    private final ImageStorageService imageStorageService;

    @Transactional(readOnly = true)
    public List<WorkspaceSummaryResponse> listWorkspaces(UUID userId, UUID currentWorkspaceId) {
        return memberRepository.findByUserIdAndStatus(userId, WorkspaceMemberStatus.ACTIVE).stream()
                .map(member -> {
                    Workspace workspace = workspaceRepository.findById(member.getWorkspaceId())
                            .orElse(null);
                    if (workspace == null) {
                        return null;
                    }
                    return toSummary(workspace, member.getRole(), workspace.getId().equals(currentWorkspaceId));
                })
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional
    public WorkspaceSummaryResponse createWorkspace(UUID userId, CreateWorkspaceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId.toString()));
        Workspace workspace = bootstrapService.createOwnedWorkspace(user, request.getName());
        return toSummary(workspace, WorkspaceRole.OWNER, false);
    }

    @Transactional
    public SwitchWorkspaceResponse switchWorkspace(UUID userId, UUID workspaceId, String sessionId) {
        WorkspaceMember member = accessService.requireActiveMember(userId, workspaceId);
        Workspace workspace = requireWorkspace(workspaceId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId.toString()));
        UUID sid = sessionId == null ? null : UUID.fromString(sessionId);
        String token = accessTokenService.issueWorkspaceAccessToken(
                user, sid, workspace.getId(), List.of(member.getRole().name()));
        return SwitchWorkspaceResponse.builder()
                .accessToken(token)
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds())
                .workspaceId(workspace.getId())
                .workspaceName(workspace.getName())
                .role(member.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public WorkspaceSettingsResponse getSettings(UUID userId, UUID workspaceId) {
        accessService.requireActiveMember(userId, workspaceId);
        return toSettings(requireWorkspace(workspaceId));
    }

    @Transactional
    public WorkspaceSettingsResponse updateSettings(UUID userId, UUID workspaceId, UpdateWorkspaceRequest request) {
        accessService.requireCanUpdate(userId, workspaceId);
        Workspace workspace = requireWorkspace(workspaceId);
        if (request.getSlug() != null
                && !request.getSlug().equalsIgnoreCase(workspace.getSlug())
                && workspaceRepository.existsBySlugIgnoreCase(request.getSlug())) {
            throw new AppException(HttpStatus.CONFLICT, "SLUG_ALREADY_EXISTS", "Slug workspace đã được sử dụng.");
        }
        workspace.updateSettings(
                request.getName(),
                request.getSlug(),
                request.getDisplayName(),
                request.getBrandColor(),
                request.getTimezone(),
                request.getIndustry(),
                request.getEnableOpenTracking(),
                request.getEnableClickTracking(),
                request.getEnforceRfc8058()
        );
        return toSettings(workspaceRepository.save(workspace));
    }

    @Transactional
    public WorkspaceSettingsResponse updateLogo(UUID userId, UUID workspaceId, MultipartFile file) {
        accessService.requireCanUpdate(userId, workspaceId);
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "LOGO_REQUIRED", "Vui lòng chọn ảnh logo.");
        }
        if (file.getSize() > MAX_LOGO_BYTES) {
            throw new AppException(HttpStatus.BAD_REQUEST, "LOGO_TOO_LARGE", "Ảnh logo tối đa 2MB.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_LOGO_TYPES.contains(contentType)) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "LOGO_TYPE_INVALID",
                    "Chỉ chấp nhận ảnh PNG, SVG, JPG hoặc WebP."
            );
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "LOGO_UNREADABLE", "Không đọc được file ảnh.");
        }
        Workspace workspace = requireWorkspace(workspaceId);
        StoredImage stored = imageStorageService.uploadWorkspaceLogo(workspaceId, content, contentType);
        workspace.updateLogo(stored.url(), stored.publicId());
        return toSettings(workspaceRepository.save(workspace));
    }

    @Transactional
    public void deleteWorkspace(UUID userId, UUID workspaceId) {
        accessService.requireOwner(userId, workspaceId);
        workspaceRepository.deleteById(workspaceId);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> listMembers(UUID userId, UUID workspaceId) {
        accessService.requireCanManageMembers(userId, workspaceId);
        List<WorkspaceMemberResponse> result = new ArrayList<>();
        for (WorkspaceMember member : memberRepository.findByWorkspaceIdOrderByJoinedAtAsc(workspaceId)) {
            User user = userRepository.findById(member.getUserId()).orElse(null);
            if (user == null) {
                continue;
            }
            result.add(toMemberResponse(member, user, userId));
        }
        for (WorkspaceInvitation invitation : invitationRepository.findByWorkspaceIdAndAcceptedAtIsNull(workspaceId)) {
            if (invitation.isExpired()) {
                continue;
            }
            result.add(WorkspaceMemberResponse.builder()
                    .id(invitation.getId())
                    .name(invitation.getEmail().split("@")[0])
                    .email(invitation.getEmail())
                    .role(invitation.getRole())
                    .status(WorkspaceMemberStatus.PENDING)
                    .joinedAt(invitation.getCreatedAt())
                    .currentUser(false)
                    .build());
        }
        return result;
    }

    @Transactional
    public WorkspaceMemberResponse updateMemberRole(
            UUID actorId,
            UUID workspaceId,
            UUID memberId,
            UpdateMemberRoleRequest request
    ) {
        WorkspaceMember actor = accessService.requireCanManageMembers(actorId, workspaceId);
        WorkspaceMember target = memberRepository.findById(memberId)
                .filter(m -> m.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên", memberId.toString()));
        if (request.getRole() != WorkspaceRole.OWNER && target.getRole() == WorkspaceRole.OWNER
                && accessService.countActiveOwners(workspaceId) <= 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "LAST_OWNER",
                    "Không thể hạ vai trò chủ sở hữu cuối cùng.");
        }
        if (request.getRole() == WorkspaceRole.OWNER && actor.getRole() != WorkspaceRole.OWNER) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN",
                    "Chỉ chủ sở hữu mới được chuyển quyền Owner.");
        }
        if (request.getRole() == WorkspaceRole.OWNER && actor.getRole() == WorkspaceRole.OWNER
                && !actor.getId().equals(target.getId())) {
            actor.changeRole(WorkspaceRole.ADMIN);
            memberRepository.save(actor);
        }
        target.changeRole(request.getRole());
        memberRepository.save(target);
        User user = userRepository.findById(target.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", target.getUserId().toString()));
        eventPublisher.publishEvent(new NotificationEvents.MemberRoleUpdated(
                workspaceId, actorId, target.getUserId(), resolveUserName(user), request.getRole().name()));
        return toMemberResponse(target, user, actorId);
    }

    @Transactional
    public void removeMember(UUID actorId, UUID workspaceId, UUID memberId) {
        accessService.requireCanManageMembers(actorId, workspaceId);
        WorkspaceMember target = memberRepository.findById(memberId)
                .filter(m -> m.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên", memberId.toString()));
        if (target.getRole() == WorkspaceRole.OWNER && accessService.countActiveOwners(workspaceId) <= 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "LAST_OWNER",
                    "Không thể xóa chủ sở hữu cuối cùng.");
        }
        User user = userRepository.findById(target.getUserId()).orElse(null);
        String name = resolveUserName(user);
        memberRepository.delete(target);
        eventPublisher.publishEvent(new NotificationEvents.MemberRemoved(
                workspaceId, actorId, target.getUserId(), name));
    }

    @Transactional
    public void inviteMember(UUID actorId, UUID workspaceId, InviteMemberRequest request) {
        accessService.requireCanManageMembers(actorId, workspaceId);
        if (request.getRole() == WorkspaceRole.OWNER) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_ROLE",
                    "Không thể mời thành viên với vai trò Owner.");
        }
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existing != null && memberRepository.existsByWorkspaceIdAndUserId(workspaceId, existing.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "MEMBER_ALREADY_EXISTS",
                    "Người dùng này đã là thành viên workspace.");
        }
        invitationRepository.findByWorkspaceIdAndEmailIgnoreCaseAndAcceptedAtIsNull(workspaceId, email)
                .forEach(invitationRepository::delete);
        String rawToken = tokenGenerator.generateRawToken();
        WorkspaceInvitation invitation = new WorkspaceInvitation(
                workspaceId,
                email,
                request.getRole(),
                tokenGenerator.hashToken(rawToken),
                actorId,
                Instant.now().plus(INVITE_TTL_DAYS, ChronoUnit.DAYS)
        );
        invitationRepository.save(invitation);
        Workspace workspace = requireWorkspace(workspaceId);
        eventPublisher.publishEvent(new WorkspaceMemberInvitedEvent(
                email, workspace.getName(), rawToken, request.getRole().name()));
        eventPublisher.publishEvent(new NotificationEvents.MemberInvited(
                workspaceId, actorId, email, request.getRole().name()));
    }

    @Transactional
    public SwitchWorkspaceResponse acceptInvitation(UUID userId, String rawToken, String sessionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId.toString()));
        WorkspaceInvitation invitation = invitationRepository
                .findByTokenHash(tokenGenerator.hashToken(rawToken.trim()))
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN",
                        "Thư mời không hợp lệ hoặc không tồn tại."));
        if (invitation.isAccepted()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Thư mời đã được sử dụng.");
        }
        if (invitation.isExpired()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TOKEN_EXPIRED", "Thư mời đã hết hạn.");
        }
        if (!user.getEmail().equalsIgnoreCase(invitation.getEmail())) {
            throw new AppException(HttpStatus.FORBIDDEN, "INVITE_EMAIL_MISMATCH",
                    "Email tài khoản không khớp với thư mời.");
        }
        if (memberRepository.existsByWorkspaceIdAndUserId(invitation.getWorkspaceId(), userId)) {
            invitation.markAccepted();
            invitationRepository.save(invitation);
            return switchWorkspace(userId, invitation.getWorkspaceId(), sessionId);
        }
        invitation.markAccepted();
        invitationRepository.save(invitation);
        memberRepository.save(new WorkspaceMember(
                invitation.getWorkspaceId(), userId, invitation.getRole()));
        eventPublisher.publishEvent(new NotificationEvents.MemberJoined(
                invitation.getWorkspaceId(), userId, resolveUserName(user), user.getEmail(), invitation.getRole().name()));
        return switchWorkspace(userId, invitation.getWorkspaceId(), sessionId);
    }

    @Transactional
    public void cancelInvitation(UUID actorId, UUID workspaceId, UUID invitationId) {
        accessService.requireCanManageMembers(actorId, workspaceId);
        WorkspaceInvitation invitation = invitationRepository.findById(invitationId)
                .filter(i -> i.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new ResourceNotFoundException("Thư mời", invitationId.toString()));
        invitationRepository.delete(invitation);
    }

    public static UUID currentWorkspaceId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        String wid = jwt.getClaimAsString("wid");
        if (wid == null || wid.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(wid);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    public static UUID requireCurrentWorkspaceId(Jwt jwt) {
        UUID workspaceId = currentWorkspaceId(jwt);
        if (workspaceId == null) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_REQUIRED",
                    "Cần chọn workspace trước khi thực hiện thao tác này.");
        }
        return workspaceId;
    }

    private Workspace requireWorkspace(UUID workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId.toString()));
    }

    private static WorkspaceSummaryResponse toSummary(Workspace workspace, WorkspaceRole role, boolean current) {
        return WorkspaceSummaryResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .logoUrl(workspace.getLogoUrl())
                .brandColor(workspace.getBrandColor())
                .plan(PLAN_FREE)
                .role(role)
                .current(current)
                .build();
    }

    private static WorkspaceSettingsResponse toSettings(Workspace workspace) {
        return WorkspaceSettingsResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .displayName(workspace.getDisplayName())
                .brandColor(workspace.getBrandColor())
                .logoUrl(workspace.getLogoUrl())
                .timezone(workspace.getTimezone())
                .industry(workspace.getIndustry())
                .enableOpenTracking(workspace.isEnableOpenTracking())
                .enableClickTracking(workspace.isEnableClickTracking())
                .enforceRfc8058(workspace.isEnforceRfc8058())
                .build();
    }

    private static String resolveUserName(User user) {
        if (user == null) {
            return "Thành viên";
        }
        String name = ((user.getLastName() != null ? user.getLastName() : "") + " "
                + (user.getFirstName() != null ? user.getFirstName() : "")).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }

    private static WorkspaceMemberResponse toMemberResponse(WorkspaceMember member, User user, UUID actorId) {
        return WorkspaceMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUserId())
                .name(resolveUserName(user))
                .email(user.getEmail())
                .role(member.getRole())
                .status(member.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .joinedAt(member.getJoinedAt())
                .lastActiveAt(user.getUpdatedAt())
                .currentUser(member.getUserId().equals(actorId))
                .build();
    }
}
