package com.mailflow.repository;

import com.mailflow.entity.OneTimeToken;
import com.mailflow.entity.OneTimeTokenPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OneTimeTokenRepository extends JpaRepository<OneTimeToken, UUID> {

    Optional<OneTimeToken> findByTokenHashAndPurpose(
            String tokenHash,
            OneTimeTokenPurpose purpose
    );

    Optional<OneTimeToken> findByTokenHashAndPurposeAndConsumedAtIsNull(
            String tokenHash,
            OneTimeTokenPurpose purpose
    );

    List<OneTimeToken> findByUserIdAndPurposeAndConsumedAtIsNull(
            UUID userId,
            OneTimeTokenPurpose purpose
    );
}
