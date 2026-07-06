package com.community.communitybackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AccountMailService {

    private static final Logger log = LoggerFactory.getLogger(AccountMailService.class);

    private final JavaMailSender mailSender;
    private final String mailHost;
    private final String mailFrom;
    private final String mailPassword;

    public AccountMailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${spring.mail.username:}") String mailFrom,
            @Value("${spring.mail.password:}") String mailPassword
    ) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.mailHost = mailHost == null ? "" : mailHost.trim();
        this.mailFrom = mailFrom == null ? "" : mailFrom.trim();
        this.mailPassword = mailPassword == null ? "" : mailPassword.trim();
    }

    public void send(String to, String subject, String text) {
        validateMailSettings();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        try {
            mailSender.send(message);
            log.info("[MAIL] status=SENT toHash={}", createLogId(to));
        } catch (MailException e) {
            log.warn("[MAIL] status=FAILED toHash={} reason={}", createLogId(to), e.getMessage());
            throw new IllegalStateException("메일 발송에 실패했습니다. Gmail 앱 비밀번호, 발신 이메일 주소, SMTP 설정을 확인해주세요.", e);
        }
    }

    private void validateMailSettings() {
        if (mailSender == null
                || !StringUtils.hasText(mailHost)
                || !StringUtils.hasText(mailFrom)
                || !StringUtils.hasText(mailPassword)) {
            throw new IllegalStateException(
                    "메일 서버 설정이 비어 있습니다. backend/community-backend/.env의 MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD 값을 확인해주세요."
            );
        }
    }

    private String createLogId(String value) {
        if (!StringUtils.hasText(value)) {
            return "empty";
        }

        return Integer.toHexString(value.trim().toLowerCase().hashCode());
    }
}
