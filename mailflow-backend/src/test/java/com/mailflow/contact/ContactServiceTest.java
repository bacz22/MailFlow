package com.mailflow.contact;

import com.mailflow.common.exception.AppException;
import com.mailflow.contact.api.request.CreateContactRequest;
import com.mailflow.contact.application.ContactService;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import com.mailflow.contact.domain.repository.ContactRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock ContactRepository contactRepository;
    @Mock WorkspaceAccessService accessService;
    @InjectMocks ContactService contactService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesContactWhenEmailIsAvailable() {
        when(accessService.requireContactWrite(userId, workspaceId)).thenReturn(activeMember());
        when(contactRepository.findByWorkspaceIdAndEmailIgnoreCase(workspaceId, "owner@mailflow.dev"))
                .thenReturn(Optional.empty());
        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
            Contact contact = invocation.getArgument(0);
            contact.setId(UUID.randomUUID());
            return contact;
        });

        CreateContactRequest request = CreateContactRequest.builder()
                .firstName("Bac")
                .lastName("Nguyen")
                .email("owner@mailflow.dev")
                .status(ContactStatus.ACTIVE)
                .build();

        var response = contactService.create(userId, workspaceId, request);

        assertThat(response.getEmail()).isEqualTo("owner@mailflow.dev");
        assertThat(response.getFullName()).isEqualTo("Nguyen Bac");
        ArgumentCaptor<Contact> captor = ArgumentCaptor.forClass(Contact.class);
        verify(contactRepository).save(captor.capture());
        assertThat(captor.getValue().getWorkspaceId()).isEqualTo(workspaceId);
    }

    @Test
    void create_rejectsDuplicateEmailInSameWorkspace() {
        when(accessService.requireContactWrite(userId, workspaceId)).thenReturn(activeMember());
        Contact existing = new Contact(workspaceId, "owner@mailflow.dev", "Old", "Name");
        existing.setId(UUID.randomUUID());
        when(contactRepository.findByWorkspaceIdAndEmailIgnoreCase(workspaceId, "owner@mailflow.dev"))
                .thenReturn(Optional.of(existing));

        CreateContactRequest request = CreateContactRequest.builder()
                .firstName("Bac")
                .lastName("Nguyen")
                .email("owner@mailflow.dev")
                .build();

        assertThatThrownBy(() -> contactService.create(userId, workspaceId, request))
                .isInstanceOf(AppException.class)
                .extracting("code")
                .isEqualTo("CONTACT_EMAIL_EXISTS");
    }

    @Test
    void create_allowsSameEmailInDifferentWorkspace() {
        UUID otherWorkspaceId = UUID.randomUUID();
        when(accessService.requireContactWrite(userId, otherWorkspaceId)).thenReturn(activeMember());
        when(contactRepository.findByWorkspaceIdAndEmailIgnoreCase(otherWorkspaceId, "shared@mailflow.dev"))
                .thenReturn(Optional.empty());
        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
            Contact contact = invocation.getArgument(0);
            contact.setId(UUID.randomUUID());
            return contact;
        });

        CreateContactRequest request = CreateContactRequest.builder()
                .firstName("Shared")
                .lastName("User")
                .email("shared@mailflow.dev")
                .build();

        var response = contactService.create(userId, otherWorkspaceId, request);

        assertThat(response.getEmail()).isEqualTo("shared@mailflow.dev");
        verify(contactRepository).save(any(Contact.class));
        verify(contactRepository).findByWorkspaceIdAndEmailIgnoreCase(eq(otherWorkspaceId), eq("shared@mailflow.dev"));
    }

    private WorkspaceMember activeMember() {
        return new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER);
    }
}
