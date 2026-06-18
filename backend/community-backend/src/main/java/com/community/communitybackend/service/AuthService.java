package com.community.communitybackend.service;

import com.community.communitybackend.dto.AuthResponseDto;
import com.community.communitybackend.dto.AccountRecoveryResponseDto;
import com.community.communitybackend.dto.FindUsernameRequestDto;
import com.community.communitybackend.dto.LoginRequestDto;
import com.community.communitybackend.dto.PasswordResetConfirmRequestDto;
import com.community.communitybackend.dto.PasswordResetRequestDto;
import com.community.communitybackend.dto.SignupRequestDto;
import com.community.communitybackend.entity.PasswordResetToken;
import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.PasswordResetTokenRepository;
import com.community.communitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.community.communitybackend.dto.UpdateNicknameRequestDto;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountMailService accountMailService;

    @Value("${app.frontend-origin:http://localhost:5173}")
    private String frontendOrigin;

    private static final int RESET_TOKEN_MINUTES = 30;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public AuthResponseDto signup(SignupRequestDto request) {
        String username = trim(request.getUsername());
        String email = trim(request.getEmail());
        String rawPassword = trim(request.getPassword());
        String nickname = trim(request.getNickname());
        String realName = trim(request.getRealName());

        if (username.isEmpty()) {
            throw new IllegalArgumentException("아이디를 입력해주세요.");
        }

        if (email.isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        if (rawPassword.isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }

        if (rawPassword.length() < 6) {
            throw new IllegalArgumentException("비밀번호는 6자 이상 입력해주세요.");
        }

        if (nickname.isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        String encodedPassword = passwordEncoder.encode(rawPassword);

        User user = User.createLocalUser(
                email,
                encodedPassword,
                username,
                realName.isEmpty() ? null : realName,
                nickname
        );

        User savedUser = userRepository.save(user);

        return AuthResponseDto.success(
                "회원가입이 완료되었습니다.",
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getNickname(),
                savedUser.getRole()
        );
    }

    public AuthResponseDto login(LoginRequestDto request) {
        String username = trim(request.getUsername());
        String rawPassword = trim(request.getPassword());

        if (username.isEmpty()) {
            throw new IllegalArgumentException("아이디를 입력해주세요.");
        }

        if (rawPassword.isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (!"LOCAL".equals(user.getProvider())) {
            throw new IllegalArgumentException("일반 로그인 계정이 아닙니다.");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return AuthResponseDto.success(
                "로그인에 성공했습니다.",
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getRole()
        );
    }

    public AccountRecoveryResponseDto findUsername(FindUsernameRequestDto request) {
        String email = trim(request.getEmail());

        if (email.isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        String emailLogId = createLogId(email);

        Optional<User> user = userRepository.findByEmail(email)
                .filter(targetUser -> "ACTIVE".equals(targetUser.getStatus()));

        if (user.isPresent()) {
            User targetUser = user.get();

            if ("LOCAL".equals(targetUser.getProvider())) {
                accountMailService.send(
                        targetUser.getEmail(),
                        "[Between Jobs] 아이디 찾기 안내",
                        "Between Jobs 아이디는 " + targetUser.getUsername() + " 입니다."
                );
                log.info("[ACCOUNT_RECOVERY] type=FIND_USERNAME status=LOCAL_MAIL_SENT emailHash={}", emailLogId);
            } else {
                accountMailService.send(
                        targetUser.getEmail(),
                        "[Between Jobs] 로그인 방식 안내",
                        "이 이메일은 Between Jobs의 " + displayProvider(targetUser.getProvider())
                                + " 로그인 계정입니다.\n\n"
                                + "로그인 화면에서 " + displayProvider(targetUser.getProvider())
                                + " 로그인을 이용해주세요.\n"
                                + "소셜 로그인 계정은 일반 비밀번호를 저장하지 않으므로 비밀번호 재설정 대상이 아닙니다."
                );
                log.info("[ACCOUNT_RECOVERY] type=FIND_USERNAME status=SOCIAL_MAIL_SENT provider={} emailHash={}",
                        targetUser.getProvider(),
                        emailLogId
                );
            }
        } else {
            log.info("[ACCOUNT_RECOVERY] type=FIND_USERNAME status=NO_MATCH emailHash={}", emailLogId);
        }

        return AccountRecoveryResponseDto.of("입력한 이메일과 일치하는 계정이 있으면 아이디 안내 메일을 발송합니다.");
    }

    @Transactional
    public AccountRecoveryResponseDto requestPasswordReset(PasswordResetRequestDto request) {
        String username = trim(request.getUsername());
        String email = trim(request.getEmail());

        if (username.isEmpty()) {
            throw new IllegalArgumentException("아이디를 입력해주세요.");
        }

        if (email.isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        String usernameLogId = createLogId(username);
        String emailLogId = createLogId(email);

        Optional<User> user = userRepository.findByUsername(username)
                .filter(this::isActiveLocalUser)
                .filter(targetUser -> email.equals(targetUser.getEmail()));

        if (user.isPresent()) {
            User targetUser = user.get();
            String rawToken = createRawToken();

            passwordResetTokenRepository.deleteByUserAndUsedAtIsNull(targetUser);
            passwordResetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
            passwordResetTokenRepository.save(
                    PasswordResetToken.builder()
                            .user(targetUser)
                            .tokenHash(hashToken(rawToken))
                            .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_MINUTES))
                            .build()
            );

            String resetUrl = normalizeFrontendOrigin() + "/password-reset?token=" + rawToken;

            accountMailService.send(
                    targetUser.getEmail(),
                    "[Between Jobs] 비밀번호 재설정 안내",
                    "아래 링크에서 30분 안에 비밀번호를 재설정해주세요.\n\n" + resetUrl
            );
            log.info("[ACCOUNT_RECOVERY] type=PASSWORD_RESET status=MAIL_SENT usernameHash={} emailHash={}",
                    usernameLogId,
                    emailLogId
            );
        } else {
            log.info("[ACCOUNT_RECOVERY] type=PASSWORD_RESET status=NO_MATCH usernameHash={} emailHash={}",
                    usernameLogId,
                    emailLogId
            );
        }

        return AccountRecoveryResponseDto.of("입력한 정보와 일치하는 계정이 있으면 비밀번호 재설정 메일을 발송합니다.");
    }

    @Transactional
    public AccountRecoveryResponseDto confirmPasswordReset(PasswordResetConfirmRequestDto request) {
        String token = trim(request.getToken());
        String newPassword = trim(request.getNewPassword());

        if (token.isEmpty()) {
            throw new IllegalArgumentException("비밀번호 재설정 토큰이 없습니다.");
        }

        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("새 비밀번호는 6자 이상 입력해주세요.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedAtIsNull(hashToken(token))
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 비밀번호 재설정 링크입니다."));

        LocalDateTime now = LocalDateTime.now();

        if (resetToken.isExpired(now)) {
            throw new IllegalArgumentException("비밀번호 재설정 링크가 만료되었습니다.");
        }

        User user = resetToken.getUser();

        if (!isActiveLocalUser(user)) {
            throw new IllegalArgumentException("비밀번호를 재설정할 수 없는 계정입니다.");
        }

        user.updatePassword(passwordEncoder.encode(newPassword));
        resetToken.markUsed(now);

        return AccountRecoveryResponseDto.of("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
    }

    @Transactional
    public AuthResponseDto updateNickname(UpdateNicknameRequestDto request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
        }

        String nickname = trim(request.getNickname());

        if (nickname.isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        if (nickname.equals(user.getNickname())) {
            throw new IllegalArgumentException("현재 닉네임과 동일합니다.");
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        user.updateNickname(nickname, LocalDateTime.now());

        return AuthResponseDto.success(
                "닉네임이 변경되었습니다.",
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getRole()
        );
    }
    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isActiveLocalUser(User user) {
        return "LOCAL".equals(user.getProvider()) && "ACTIVE".equals(user.getStatus());
    }

    private String displayProvider(String provider) {
        if ("GOOGLE".equals(provider)) {
            return "Google";
        }

        if ("KAKAO".equals(provider)) {
            return "Kakao";
        }

        return provider;
    }

    private String createRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedToken = digest.digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hashedToken);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("비밀번호 재설정 토큰을 처리할 수 없습니다.");
        }
    }

    private String normalizeFrontendOrigin() {
        String origin = trim(frontendOrigin);

        if (origin.endsWith("/")) {
            return origin.substring(0, origin.length() - 1);
        }

        return origin;
    }

    private String createLogId(String value) {
        return hashToken(value).substring(0, 12);
    }
}
