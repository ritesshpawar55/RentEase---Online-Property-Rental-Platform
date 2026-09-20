package com.rentease.backend.controller;

import com.rentease.backend.dto.*;
import com.rentease.backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    private String currentEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication().getName();
    }

    // Create Razorpay order
    @PostMapping("/create-order/{bookingId}")
    public ResponseEntity<PaymentOrderResponse> createOrder(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                paymentService.createOrder(bookingId, currentEmail()));
    }

    // Verify payment after Razorpay checkout
    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(
                paymentService.verifyPayment(request, currentEmail()));
    }

    // Get payment status for a booking
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getPayment(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                paymentService.getPaymentByBooking(
                        bookingId, currentEmail()));
    }
}