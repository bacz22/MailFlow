package com.mailflow.user.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "email", nullable = false, length = 320)
    private String email;

    /**
     * Always contains an encoded password. Never assign or persist a raw password.
     * The current migration names this database column "password".
     */
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "two_factor_enabled", nullable = false)
    private boolean twoFactorEnabled;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "job_title", length = 120)
    private String jobTitle;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "avatar_public_id", length = 255)
    private String avatarPublicId;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public User(
            String email,
            String password,
            String firstName,
            String lastName
    ) {
        this.email = normalizeEmail(email);
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public void verifyEmail(Instant verifiedAt) {
        this.emailVerifiedAt = verifiedAt;
        this.status = UserStatus.ACTIVE;
    }

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    public void updateProfile(String firstName, String lastName, String phone, String jobTitle) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.jobTitle = jobTitle;
    }

    public void updateAvatar(String avatarUrl, String avatarPublicId) {
        this.avatarUrl = avatarUrl;
        this.avatarPublicId = avatarPublicId;
    }

    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void addRole(Role role) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        this.roles.add(role);
    }

    public void removeRole(Role role) {
        if (this.roles != null) {
            this.roles.remove(role);
        }
    }

    @PrePersist
    void onCreate() {
        email = normalizeEmail(email);

        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = UserStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        email = normalizeEmail(email);
        updatedAt = Instant.now();
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
