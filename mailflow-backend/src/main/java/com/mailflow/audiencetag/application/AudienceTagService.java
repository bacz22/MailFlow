package com.mailflow.audiencetag.application;

import com.mailflow.audiencelist.domain.repository.AudienceListRepository;
import com.mailflow.audiencetag.api.request.CreateAudienceTagRequest;
import com.mailflow.audiencetag.api.request.UpdateAudienceTagRequest;
import com.mailflow.audiencetag.api.response.AudienceTagResponse;
import com.mailflow.audiencetag.api.response.SyncTagsResponse;
import com.mailflow.audiencetag.domain.model.AudienceTag;
import com.mailflow.audiencetag.domain.repository.AudienceTagRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.contact.domain.repository.ContactRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AudienceTagService {

    private final AudienceTagRepository tagRepository;
    private final ContactRepository contactRepository;
    private final AudienceListRepository listRepository;
    private final WorkspaceAccessService accessService;

    @Transactional(readOnly = true)
    public List<AudienceTagResponse> list(UUID userId, UUID workspaceId, String q) {
        accessService.requireTagRead(userId, workspaceId);
        List<AudienceTag> tags;
        if (q == null || q.isBlank()) {
            tags = tagRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        } else {
            String like = "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
            tags = tagRepository.search(workspaceId, like);
        }
        return tags.stream().map(tag -> toResponse(tag, workspaceId)).toList();
    }

    @Transactional
    public AudienceTagResponse create(UUID userId, UUID workspaceId, CreateAudienceTagRequest request) {
        accessService.requireTagWrite(userId, workspaceId);
        String name = AudienceTag.normalizeName(request.getName());
        if (name.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TAG_NAME_REQUIRED", "Vui lòng nhập tên thẻ.");
        }
        if (tagRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, name)) {
            throw new AppException(HttpStatus.CONFLICT, "TAG_NAME_EXISTS",
                    "Thẻ \"" + name + "\" đã tồn tại trong workspace.");
        }
        String color = request.getColor() == null || request.getColor().isBlank()
                ? AudienceTag.DEFAULT_COLOR
                : request.getColor().trim();
        AudienceTag tag = new AudienceTag(workspaceId, name, color);
        tag = tagRepository.save(tag);
        return toResponse(tag, workspaceId);
    }

    @Transactional
    public AudienceTagResponse update(
            UUID userId,
            UUID workspaceId,
            UUID tagId,
            UpdateAudienceTagRequest request
    ) {
        accessService.requireTagWrite(userId, workspaceId);
        AudienceTag tag = requireTag(workspaceId, tagId);
        String oldName = tag.getName();
        String newName = oldName;
        if (request.getName() != null) {
            newName = AudienceTag.normalizeName(request.getName());
            if (newName.isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "TAG_NAME_REQUIRED", "Vui lòng nhập tên thẻ.");
            }
            if (!oldName.equalsIgnoreCase(newName)
                    && tagRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, newName)) {
                throw new AppException(HttpStatus.CONFLICT, "TAG_NAME_EXISTS",
                        "Thẻ \"" + newName + "\" đã tồn tại trong workspace.");
            }
        }
        tag.apply(request.getName() != null ? newName : null, request.getColor());
        if (!oldName.equals(newName)) {
            contactRepository.renameTagInWorkspace(workspaceId, oldName, newName);
            listRepository.renameTagInWorkspace(workspaceId, oldName, newName);
        }
        return toResponse(tag, workspaceId);
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID tagId) {
        accessService.requireTagDelete(userId, workspaceId);
        AudienceTag tag = requireTag(workspaceId, tagId);
        String name = tag.getName();
        contactRepository.removeTagFromWorkspace(workspaceId, name);
        listRepository.removeTagFromWorkspace(workspaceId, name);
        tagRepository.delete(tag);
    }

    @Transactional
    public SyncTagsResponse syncFromContacts(UUID userId, UUID workspaceId) {
        accessService.requireTagWrite(userId, workspaceId);
        List<AudienceTag> existing = tagRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        Set<String> existingLower = new HashSet<>();
        for (AudienceTag tag : existing) {
            existingLower.add(tag.getName().toLowerCase(Locale.ROOT));
        }
        int created = 0;
        for (String distinct : contactRepository.findDistinctTags(workspaceId)) {
            String name = AudienceTag.normalizeName(distinct);
            if (name.isEmpty()) {
                continue;
            }
            if (existingLower.contains(name.toLowerCase(Locale.ROOT))) {
                continue;
            }
            tagRepository.save(new AudienceTag(workspaceId, name, AudienceTag.DEFAULT_COLOR));
            existingLower.add(name.toLowerCase(Locale.ROOT));
            created++;
        }
        List<AudienceTagResponse> tags = list(userId, workspaceId, null);
        return new SyncTagsResponse(created, tags);
    }

    private AudienceTag requireTag(UUID workspaceId, UUID tagId) {
        return tagRepository.findByIdAndWorkspaceId(tagId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId.toString()));
    }

    private AudienceTagResponse toResponse(AudienceTag tag, UUID workspaceId) {
        long contactCount = contactRepository.countByWorkspaceIdAndTag(workspaceId, tag.getName());
        return AudienceTagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .color(tag.getColor())
                .contactCount(contactCount)
                .createdAt(tag.getCreatedAt())
                .updatedAt(tag.getUpdatedAt())
                .build();
    }
}
