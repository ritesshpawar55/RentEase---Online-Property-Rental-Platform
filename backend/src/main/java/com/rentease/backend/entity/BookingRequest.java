package com.rentease.backend.entity;

import com.rentease.backend.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(columnDefinition = "TEXT")
    private String message;

    // Rent negotiation
    @Column(name = "counter_offer")
    private Double counterOffer;

    @Column(name = "counter_offer_by")
    private String counterOfferBy; // "TENANT" or "LANDLORD"

    @Column(name = "response_message", columnDefinition = "TEXT")
    private String responseMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}