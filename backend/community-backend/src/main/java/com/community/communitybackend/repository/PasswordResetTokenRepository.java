package com.community.communitybackend.repository;

import com.community.communitybackend.entity.PasswordResetToken;
import com.community.communitybackend.entity.User;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    void deleteByUserAndUsedAtIsNull(User user);

    void deleteByExpiresAtBefore(LocalDateTime expiresAt);
}
