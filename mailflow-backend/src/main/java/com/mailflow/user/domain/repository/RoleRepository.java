package com.mailflow.user.domain.repository;

import com.mailflow.user.domain.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
