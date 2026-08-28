package com.mailflow.user.domain.repository;

import com.mailflow.user.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmailIgnoreCase(String normalizedEmail);

    Optional<User> findByEmailIgnoreCase(String normalizedEmail);
}
