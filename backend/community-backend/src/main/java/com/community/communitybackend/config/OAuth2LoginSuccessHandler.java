package com.community.communitybackend.config;

import com.community.communitybackend.entity.User;
import com.community.communitybackend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @Value("${app.frontend-origin}")
    private String frontendOrigin;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String provider;
        String providerId;

        if (attributes.get("sub") != null) {
            provider = "GOOGLE";
            providerId = (String) attributes.get("sub");
        } else if (attributes.get("id") != null) {
            provider = "KAKAO";
            providerId = String.valueOf(attributes.get("id"));
        } else {
            response.sendRedirect(frontendUrl("/login?error=social_login_failed"));
            return;
        }

        User user = userRepository.findByProviderAndProviderId(provider, providerId)
                .orElse(null);

        if (user == null) {
            response.sendRedirect(frontendUrl("/login?error=user_not_found"));
            return;
        }

        String redirectUrl = frontendUrl("/oauth2/redirect")
                + "?userId=" + user.getId()
                + "&username=" + encode(user.getUsername())
                + "&nickname=" + encode(user.getNickname())
                + "&role=" + encode(user.getRole());

        System.out.println("OAuth2 redirectUrl = " + redirectUrl);
        response.sendRedirect(redirectUrl);
    }

    private String frontendUrl(String path) {
        String normalizedOrigin = frontendOrigin.endsWith("/")
                ? frontendOrigin.substring(0, frontendOrigin.length() - 1)
                : frontendOrigin;

        return normalizedOrigin + path;
    }

    private String encode(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }
}
