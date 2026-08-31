package com.rentease.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String name, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("RentEase — Your OTP Verification Code");
            message.setText(
                    "Hello " + name + ",\n\n" +
                            "Welcome to RentEase!\n\n" +
                            "Your OTP verification code is:\n\n" +
                            "        " + otp + "\n\n" +
                            "This code is valid for 10 minutes.\n" +
                            "Do not share this code with anyone.\n\n" +
                            "If you did not register on RentEase, please ignore this email.\n\n" +
                            "Regards,\n" +
                            "The RentEase Team"
            );
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }

    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Welcome to RentEase!");
            message.setText(
                    "Hello " + name + ",\n\n" +
                            "Your account has been verified successfully!\n\n" +
                            "You can now:\n" +
                            "- Search properties across Indian cities\n" +
                            "- Get AI-powered fair rent estimates\n" +
                            "- Book properties directly\n\n" +
                            "Start exploring: http://localhost:5173\n\n" +
                            "Regards,\n" +
                            "The RentEase Team"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendBookingNotification(String toEmail, String toName,
                                        String otherPartyName, String propertyTitle,
                                        String subject) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("RentEase — " + subject);
            message.setText(
                    "Hello " + toName + ",\n\n" +
                            subject + "\n\n" +
                            "Property: " + propertyTitle + "\n" +
                            "Related to: " + otherPartyName + "\n\n" +
                            "Log in to RentEase to view full details: http://localhost:5173\n\n" +
                            "Regards,\n" +
                            "The RentEase Team"
            );
            mailSender.send(message);
            log.info("Booking notification sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send booking notification to {}: {}", toEmail, e.getMessage());
            // Don't throw — booking should succeed even if email fails
        }
    }


    public void sendPasswordResetEmail(String toEmail,
                                       String name,
                                       String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("RentEase — Password Reset Request");
            message.setText(
                    "Hello " + name + ",\n\n" +
                            "We received a request to reset your password.\n\n" +
                            "Your password reset token is:\n\n" +
                            "        " + resetToken + "\n\n" +
                            "This token is valid for 15 minutes.\n" +
                            "Use it on the reset password page: " +
                            "http://localhost:5173/reset-password\n\n" +
                            "If you did not request a password reset, " +
                            "please ignore this email.\n\n" +
                            "Regards,\n" +
                            "The RentEase Team"
            );
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}",
                    toEmail, e.getMessage());
            throw new RuntimeException(
                    "Failed to send reset email. Please try again.");
        }
    }

    public void sendPaymentConfirmation(String toEmail,
                                        String name,
                                        String propertyTitle,
                                        Double amount) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("RentEase — Payment Confirmed!");
            message.setText(
                    "Hello " + name + ",\n\n" +
                            "Your payment has been confirmed successfully!\n\n" +
                            "Property: " + propertyTitle + "\n" +
                            "Amount Paid: ₹" + String.format("%.2f", amount) + "\n\n" +
                            "Your booking is now COMPLETED.\n" +
                            "You can now write a review after your stay.\n\n" +
                            "Thank you for using RentEase!\n\n" +
                            "Regards,\n" +
                            "The RentEase Team"
            );
            mailSender.send(message);
            log.info("Payment confirmation sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send payment confirmation to {}: {}",
                    toEmail, e.getMessage());
        }
    }
}