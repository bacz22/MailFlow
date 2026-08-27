package com.mailflow.auth.event;

import com.mailflow.mail.service.IEmailService;
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

    private final IEmailService emailService;

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
}
