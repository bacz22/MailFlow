package com.mailflow.auth.domain.repository;

import com.mailflow.auth.domain.model.OneTimeToken;
import com.mailflow.auth.domain.model.OneTimeTokenPurpose;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM OneTimeToken t WHERE t.tokenHash = :tokenHash AND t.purpose = :purpose")
    Optional<OneTimeToken> findByTokenHashAndPurposeForUpdate(
            @Param("tokenHash") String tokenHash,
            @Param("purpose") OneTimeTokenPurpose purpose
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
