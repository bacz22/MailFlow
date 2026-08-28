package com.mailflow.auth.application.event;

import com.mailflow.auth.application.event.PasswordResetRequestedEvent;
import com.mailflow.auth.application.event.UserRegisteredEvent;
import com.mailflow.infrastructure.mail.EmailSender;
import com.mailflow.workspace.application.event.WorkspaceMemberInvitedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthEventListener {

    private final EmailSender emailService;

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        log.info("Bắt đầu xử lý sự kiện gửi email xác thực bất đồng bộ cho: [{}]", event.getEmail());
        emailService.sendVerificationEmail(
                event.getEmail(),
                event.getFullName(),
                event.getRawToken()
        );
    }

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePasswordResetRequestedEvent(PasswordResetRequestedEvent event) {
        log.info("Bắt đầu xử lý sự kiện gửi email đặt lại mật khẩu bất đồng bộ cho: [{}]", event.getEmail());
        emailService.sendPasswordResetEmail(
                event.getEmail(),
                event.getFullName(),
                event.getRawToken()
        );
    }

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleWorkspaceMemberInvitedEvent(WorkspaceMemberInvitedEvent event) {
        log.info("Bắt đầu gửi thư mời workspace tới [{}]", event.getEmail());
        emailService.sendWorkspaceInvitationEmail(
                event.getEmail(),
                event.getWorkspaceName(),
                event.getRawToken(),
                event.getRole()
        );
    }
}
