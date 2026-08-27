package com.mailflow.repository;

import com.mailflow.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {

    List<AuthSession> findAllByUserIdAndRevokedAtIsNullOrderByLastActiveAtDesc(UUID userId);

    Optional<AuthSession> findByIdAndUserId(UUID id, UUID userId);

    List<AuthSession> findAllByUserId(UUID userId);
}
