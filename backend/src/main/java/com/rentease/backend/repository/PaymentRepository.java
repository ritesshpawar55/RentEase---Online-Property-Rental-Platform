package com.rentease.backend.repository;

import com.rentease.backend.entity.Payment;
import com.rentease.backend.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    boolean existsByBookingIdAndStatus(
            Long bookingId, PaymentStatus status);
}