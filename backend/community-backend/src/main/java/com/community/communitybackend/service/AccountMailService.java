package com.community.communitybackend.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AccountMailService {

    private final JavaMailSender mailSender;
    private final String mailHost;
    private final String mailFrom;

    public AccountMailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${spring.mail.username:}") String mailFrom
    ) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.mailHost = mailHost == null ? "" : mailHost.trim();
        this.mailFrom = mailFrom == null ? "" : mailFrom.trim();
    }

    public void send(String to, String subject, String text) {
        if (mailSender == null || mailHost.isEmpty()) {
            throw new IllegalStateException("메일 서버 설정이 필요합니다. MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD 값을 확인해주세요.");
        }

        SimpleMailMessage message = new SimpleMailMessage();

        if (!mailFrom.isEmpty()) {
            message.setFrom(mailFrom);
        }

        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }
}
