package com.rentease.backend.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.rentease.backend.dto.*;
import com.rentease.backend.entity.*;
import com.rentease.backend.enums.*;
import com.rentease.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RazorpayClient razorpayClient;
    private final EmailService emailService;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    // ── Create Razorpay Order ──
    public PaymentOrderResponse createOrder(Long bookingId,
                                            String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        // Step 1 — Ownership check
        if (!booking.getTenant().getEmail().equals(tenantEmail)) {
            throw new RuntimeException(
                    "You can only pay for your own bookings");
        }

        // Step 2 — Check if already paid FIRST (before status check)
        Payment existingPayment = paymentRepository
                .findByBookingId(bookingId)
                .orElse(null);

        if (existingPayment != null &&
                existingPayment.getStatus() == PaymentStatus.SUCCESS) {
            throw new RuntimeException(
                    "This booking has already been paid");
        }

        // Step 3 — Check booking status (ACCEPTED or COMPLETED allowed)
        if (booking.getStatus() != BookingStatus.ACCEPTED &&
                booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException(
                    "Payment only allowed for accepted bookings");
        }

        // Step 4 — If pending payment exists, reuse it
        if (existingPayment != null &&
                existingPayment.getStatus() == PaymentStatus.PENDING) {
            try {
                int amountInPaise = (int) (booking.getProperty()
                        .getRent() * 100);

                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "booking_" + bookingId);

                Order order = razorpayClient.orders.create(orderRequest);
                String razorpayOrderId = order.get("id");

                existingPayment.setRazorpayOrderId(razorpayOrderId);
                existingPayment.setStatus(PaymentStatus.PENDING);
                paymentRepository.save(existingPayment);

                log.info("Reused existing payment for booking: {}",
                        bookingId);

                return PaymentOrderResponse.builder()
                        .razorpayOrderId(razorpayOrderId)
                        .amount(booking.getProperty().getRent())
                        .currency("INR")
                        .keyId(razorpayKeyId)
                        .bookingId(bookingId)
                        .propertyTitle(booking.getProperty().getTitle())
                        .tenantName(tenant.getName())
                        .tenantEmail(tenant.getEmail())
                        .build();

            } catch (RazorpayException e) {
                throw new RuntimeException(
                        "Payment initialization failed: "
                                + e.getMessage());
            }
        }

        // Step 5 — Create fresh payment record
        try {
            int amountInPaise = (int) (booking.getProperty()
                    .getRent() * 100);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "booking_" + bookingId);
            orderRequest.put("notes", new JSONObject()
                    .put("bookingId", bookingId)
                    .put("propertyTitle",
                            booking.getProperty().getTitle())
                    .put("tenantEmail", tenantEmail));

            Order order = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = order.get("id");

            Payment payment = Payment.builder()
                    .booking(booking)
                    .razorpayOrderId(razorpayOrderId)
                    .amount(booking.getProperty().getRent())
                    .currency("INR")
                    .status(PaymentStatus.PENDING)
                    .build();

            paymentRepository.save(payment);

            log.info("Razorpay order created: {} for booking: {}",
                    razorpayOrderId, bookingId);

            return PaymentOrderResponse.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .amount(booking.getProperty().getRent())
                    .currency("INR")
                    .keyId(razorpayKeyId)
                    .bookingId(bookingId)
                    .propertyTitle(booking.getProperty().getTitle())
                    .tenantName(tenant.getName())
                    .tenantEmail(tenant.getEmail())
                    .build();

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}",
                    e.getMessage());
            throw new RuntimeException(
                    "Payment initialization failed: " + e.getMessage());
        }
    }

    // ── Verify Payment Signature ──
    public PaymentResponse verifyPayment(
            PaymentVerifyRequest request, String tenantEmail) {

        Payment payment = paymentRepository
                .findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() ->
                        new RuntimeException("Payment record not found"));

        // Verify signature using HMAC SHA256
        boolean isValid = verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValid) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Invalid payment signature");
            paymentRepository.save(payment);
            throw new RuntimeException(
                    "Payment verification failed — invalid signature");
        }

        // Update payment record
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        // Update booking to COMPLETED
        BookingRequest booking = payment.getBooking();
        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        // Send confirmation email to tenant
        emailService.sendPaymentConfirmation(
                booking.getTenant().getEmail(),
                booking.getTenant().getName(),
                booking.getProperty().getTitle(),
                payment.getAmount()
        );

        log.info("Payment verified successfully: {}",
                request.getRazorpayPaymentId());

        return mapToResponse(payment);
    }

    // ── Get Payment by Booking ──
    public PaymentResponse getPaymentByBooking(Long bookingId,
                                               String tenantEmail) {
        Payment payment = paymentRepository
                .findByBookingId(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No payment found for this booking"));
        return mapToResponse(payment);
    }

    // ── HMAC SHA256 Signature Verification ──
    private boolean verifySignature(String orderId,
                                    String paymentId,
                                    String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    razorpayKeySecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKey);
            byte[] hash = mac.doFinal(
                    payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            return hexString.toString().equals(signature);
        } catch (Exception e) {
            log.error("Signature verification error: {}",
                    e.getMessage());
            return false;
        }
    }

    // ── Mapper ──
    private PaymentResponse mapToResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .failureReason(p.getFailureReason())
                .createdAt(p.getCreatedAt())
                .bookingId(p.getBooking().getId())
                .propertyTitle(p.getBooking()
                        .getProperty().getTitle())
                .build();
    }
}