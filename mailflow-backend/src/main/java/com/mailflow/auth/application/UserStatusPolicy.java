package com.mailflow.auth.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import org.springframework.http.HttpStatus;

final class UserStatusPolicy {

    private UserStatusPolicy() {
    }

    static void requireActive(User user) {
        if (user.getStatus() == UserStatus.PENDING) {
            throw new AppException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED",
                    "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản.");
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED",
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED",
                    "Tài khoản này đã bị vô hiệu hóa.");
        }
    }
}
