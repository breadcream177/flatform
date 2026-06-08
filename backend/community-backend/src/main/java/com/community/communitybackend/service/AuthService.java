package com.community.communitybackend.service;

import com.community.communitybackend.dto.AuthResponseDto;
import com.community.communitybackend.dto.LoginRequestDto;
import com.community.communitybackend.dto.SignupRequestDto;
import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.community.communitybackend.dto.UpdateNicknameRequestDto;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
}