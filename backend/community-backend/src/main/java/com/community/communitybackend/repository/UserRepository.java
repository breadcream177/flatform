package com.community.communitybackend.repository;

import com.community.communitybackend.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByNickname(String nickname);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    // ✅ SNS 로그인 필수
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    // ✅ (선택) 이메일 기반 매칭
    Optional<User> findByProviderAndEmail(String provider, String email);
}