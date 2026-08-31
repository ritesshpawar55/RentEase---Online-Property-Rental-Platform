package com.rentease.backend.service;

import com.rentease.backend.dto.*;
import com.rentease.backend.entity.*;
import com.rentease.backend.enums.*;
import com.rentease.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BookingSseService bookingSseService;

    // ── TENANT: Create booking request ──
    public BookingResponse createBooking(BookingRequestDto dto, String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.ACTIVE) {
            throw new RuntimeException("This property is not available for booking");
        }

        if (property.getLandlord().getId().equals(tenant.getId())) {
            throw new RuntimeException("You cannot book your own property");
        }

        // Prevent duplicate pending requests for same property
        if (bookingRepository.existsByTenantIdAndPropertyIdAndStatus(
                tenant.getId(), property.getId(), BookingStatus.PENDING)) {
            throw new RuntimeException("You already have a pending request for this property");
        }

        BookingRequest booking = BookingRequest.builder()
                .tenant(tenant)
                .property(property)
                .moveInDate(dto.getMoveInDate())
                .message(dto.getMessage())
                .counterOffer(dto.getCounterOffer())
                .counterOfferBy(dto.getCounterOffer() != null ? "TENANT" : null)
                .status(BookingStatus.PENDING)
                .build();

        BookingRequest saved = bookingRepository.save(booking);

        // Notify landlord via email
        emailService.sendBookingNotification(
                property.getLandlord().getEmail(),
                property.getLandlord().getName(),
                tenant.getName(),
                property.getTitle(),
                "New booking request received"
        );

        BookingResponse response = mapToResponse(saved);

        // Notify landlord via SSE
        bookingSseService.notifyLandlord(property.getLandlord().getId(), response);

        return response;
    }

    // ── TENANT: Get own bookings ──
    public List<BookingResponse> getTenantBookings(String tenantEmail, BookingStatus status) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<BookingRequest> bookings = (status != null)
                ? bookingRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenant.getId(), status)
                : bookingRepository.findByTenantIdOrderByCreatedAtDesc(tenant.getId());

        return bookings.stream().map(this::mapToResponse).toList();
    }

    // ── LANDLORD: Get bookings for their properties ──
    public List<BookingResponse> getLandlordBookings(String landlordEmail, BookingStatus status) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<BookingRequest> bookings = (status != null)
                ? bookingRepository.findByProperty_Landlord_IdAndStatusOrderByCreatedAtDesc(landlord.getId(), status)
                : bookingRepository.findByProperty_Landlord_IdOrderByCreatedAtDesc(landlord.getId());

        return bookings.stream().map(this::mapToResponse).toList();
    }

    // ── LANDLORD: Accept / Reject / Counter ──
    public BookingResponse updateBookingStatus(Long bookingId, BookingStatusUpdateDto dto,
                                               String landlordEmail) {
        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found"));

        if (!booking.getProperty().getLandlord().getEmail().equals(landlordEmail)) {
            throw new RuntimeException("You can only manage bookings for your own properties");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("This booking request has already been processed");
        }

        booking.setStatus(dto.getStatus());
        booking.setResponseMessage(dto.getResponseMessage());

        // Landlord counters tenant's offer
        if (dto.getCounterOffer() != null) {
            booking.setCounterOffer(dto.getCounterOffer());
            booking.setCounterOfferBy("LANDLORD");
            booking.setStatus(BookingStatus.PENDING); // stays pending for tenant to respond
        }

        BookingRequest saved = bookingRepository.save(booking);

        // Email tenant about the decision
        emailService.sendBookingNotification(
                booking.getTenant().getEmail(),
                booking.getTenant().getName(),
                booking.getProperty().getLandlord().getName(),
                booking.getProperty().getTitle(),
                "Your booking request status: " + dto.getStatus()
        );

        BookingResponse response = mapToResponse(saved);

        // Notify tenant via SSE
        bookingSseService.notifyTenant(booking.getTenant().getId(), response);

        return response;
    }

    // ── TENANT: Cancel own pending request ──
    public void cancelBooking(Long bookingId, String tenantEmail) {
        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found"));

        if (!booking.getTenant().getEmail().equals(tenantEmail)) {
            throw new RuntimeException("You can only cancel your own booking requests");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    // ── TENANT: Respond to landlord's counter-offer ──
    public BookingResponse respondToCounter(Long bookingId, BookingStatus decision,
                                            String tenantEmail) {
        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found"));

        if (!booking.getTenant().getEmail().equals(tenantEmail)) {
            throw new RuntimeException("You can only respond to your own booking requests");
        }

        if (!"LANDLORD".equals(booking.getCounterOfferBy())) {
            throw new RuntimeException("There is no landlord counter-offer to respond to");
        }

        if (decision != BookingStatus.ACCEPTED && decision != BookingStatus.REJECTED) {
            throw new RuntimeException("Decision must be ACCEPTED or REJECTED");
        }

        booking.setStatus(decision);
        BookingRequest saved = bookingRepository.save(booking);

        BookingResponse response = mapToResponse(saved);
        bookingSseService.notifyLandlord(booking.getProperty().getLandlord().getId(), response);

        return response;
    }

    // ── Dashboard stat helper ──
    public long countPendingForLandlord(Long landlordId) {
        return bookingRepository.countByProperty_Landlord_IdAndStatus(landlordId, BookingStatus.PENDING);
    }

    // ── Mapper ──
    private BookingResponse mapToResponse(BookingRequest b) {
        Property property = b.getProperty();
        User tenant = b.getTenant();
        User landlord = property.getLandlord();

        String imageUrl = null;
        try {
            if (property.getImages() != null && !property.getImages().isEmpty()) {
                imageUrl = property.getImages().get(0).getImageUrl();
            }
        } catch (Exception ignored) {}

        return BookingResponse.builder()
                .id(b.getId())
                .moveInDate(b.getMoveInDate())
                .message(b.getMessage())
                .counterOffer(b.getCounterOffer())
                .counterOfferBy(b.getCounterOfferBy())
                .responseMessage(b.getResponseMessage())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .property(BookingResponse.PropertySummary.builder()
                        .id(property.getId())
                        .title(property.getTitle())
                        .city(property.getCity())
                        .locality(property.getLocality())
                        .rent(property.getRent())
                        .imageUrl(imageUrl)
                        .build())
                .tenant(BookingResponse.PersonInfo.builder()
                        .id(tenant.getId())
                        .name(tenant.getName())
                        .phone(tenant.getPhone())
                        .email(tenant.getEmail())
                        .build())
                .landlord(BookingResponse.PersonInfo.builder()
                        .id(landlord.getId())
                        .name(landlord.getName())
                        .phone(landlord.getPhone())
                        .email(landlord.getEmail())
                        .build())
                .build();
    }
}