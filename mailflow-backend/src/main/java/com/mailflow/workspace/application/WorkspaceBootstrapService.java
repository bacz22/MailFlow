package com.mailflow.workspace.application;

import com.mailflow.user.domain.model.User;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import com.mailflow.workspace.domain.repository.WorkspaceMemberRepository;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceBootstrapService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    @Transactional
    public Workspace createOwnedWorkspace(User user, String requestedName) {
        String name = resolveName(user, requestedName);
        String slug = uniqueSlug(name, user.getId());
        Workspace workspace = new Workspace(name, slug, displayName(user, name));
        Workspace saved = workspaceRepository.save(workspace);
        memberRepository.save(new WorkspaceMember(saved.getId(), user.getId(), WorkspaceRole.OWNER));
        return saved;
    }

    private static String resolveName(User user, String requestedName) {
        if (requestedName != null && !requestedName.isBlank()) {
            return requestedName.trim();
        }
        String fullName = fullName(user);
        if (!fullName.isBlank()) {
            return fullName + " Workspace";
        }
        String local = user.getEmail() == null ? "workspace" : user.getEmail().split("@")[0];
        return local + " Workspace";
    }

    private static String displayName(User user, String workspaceName) {
        String fullName = fullName(user);
        return fullName.isBlank() ? workspaceName : fullName;
    }

    private static String fullName(User user) {
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        return (last + " " + first).trim();
    }

    private String uniqueSlug(String name, UUID userId) {
        String base = slugify(name);
        if (base.isBlank()) {
            base = "ws";
        }
        String candidate = base;
        int suffix = 0;
        while (workspaceRepository.existsBySlugIgnoreCase(candidate)) {
            suffix++;
            candidate = base + "-" + userId.toString().substring(0, 8) + (suffix == 1 ? "" : "-" + suffix);
        }
        return candidate;
    }

    static String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (normalized.length() > 100) {
            return normalized.substring(0, 100).replaceAll("-+$", "");
        }
        return normalized;
    }
}
