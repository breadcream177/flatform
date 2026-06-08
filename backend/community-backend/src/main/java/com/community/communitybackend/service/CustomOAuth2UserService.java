package com.community.communitybackend.service;

import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // google, kakao
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String providerId;
        String email;
        String nickname;

        // ✅ 구글
        if ("google".equals(provider)) {
            providerId = (String) attributes.get("sub");
            email = (String) attributes.get("email");
            nickname = (String) attributes.get("name");
        }
        // ✅ 카카오
        else if ("kakao".equals(provider)) {
            providerId = String.valueOf(attributes.get("id"));

            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;

            Map<String, Object> profile = kakaoAccount != null
                    ? (Map<String, Object>) kakaoAccount.get("profile")
                    : null;

            nickname = profile != null ? (String) profile.get("nickname") : null;
        }
        else {
            throw new OAuth2AuthenticationException("지원하지 않는 로그인입니다.");
        }

        // ✅ 기존 유저 조회
        Optional<User> existingUser =
                userRepository.findByProviderAndProviderId(provider, providerId);

        if (existingUser.isPresent()) {
            return oAuth2User;
        }

        // ✅ username 자동 생성
        String username = provider + "_" + providerId;

        // ✅ nickname 기본값 처리
        if (nickname == null || nickname.isEmpty()) {
            nickname = username;
        }

        // ✅ 유저 생성
        User user = User.builder()
                .email(email != null ? email : username + "@social.com")
                .password(null)
                .username(username)
                .nickname(nickname)
                .provider(provider.toUpperCase())
                .providerId(providerId)
                .role("USER")
                .status("ACTIVE")
                .build();

        userRepository.save(user);

        return oAuth2User;
    }
}