package com.rentease.backend.controller;

import com.rentease.backend.dto.*;
import com.rentease.backend.enums.BookingStatus;
import com.rentease.backend.repository.UserRepository;
import com.rentease.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingSseService bookingSseService;
    private final UserRepository userRepository;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ── TENANT: Create booking ──
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequestDto dto) {
        return ResponseEntity.ok(bookingService.createBooking(dto, currentEmail()));
    }

    // ── TENANT: My bookings (optional ?status=PENDING) ──
    @GetMapping("/tenant")
    public ResponseEntity<List<BookingResponse>> getTenantBookings(
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getTenantBookings(currentEmail(), status));
    }

    // ── LANDLORD: Bookings for my properties (optional ?status=PENDING) ──
    @GetMapping("/landlord")
    public ResponseEntity<List<BookingResponse>> getLandlordBookings(
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getLandlordBookings(currentEmail(), status));
    }

    // ── LANDLORD: Accept / Reject / Counter ──
    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateDto dto) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, dto, currentEmail()));
    }

    // ── TENANT: Cancel own pending request ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id, currentEmail());
        return ResponseEntity.noContent().build();
    }

    // ── TENANT: Respond to landlord's counter-offer ──
    @PutMapping("/{id}/respond-counter")
    public ResponseEntity<BookingResponse> respondToCounter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        BookingStatus decision = BookingStatus.valueOf(body.get("decision"));
        return ResponseEntity.ok(bookingService.respondToCounter(id, decision, currentEmail()));
    }

    // ── SSE: Realtime booking status stream (per logged-in user) ──
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamBookingUpdates() {
        Long userId = userRepository.findByEmail(currentEmail())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        return bookingSseService.subscribe(userId);
    }
}