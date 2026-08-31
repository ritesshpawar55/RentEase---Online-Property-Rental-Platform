package com.rentease.backend.service;

import com.rentease.backend.dto.DashboardStatsResponse;
import com.rentease.backend.entity.*;
import com.rentease.backend.enums.*;
import com.rentease.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LandlordDashboardService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    public DashboardStatsResponse getDashboardStats(String landlordEmail) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new RuntimeException("Landlord not found"));

        Long landlordId = landlord.getId();

        // ── Property stats ──
        List<Property> allProperties = propertyRepository
                .findByLandlordIdAndStatusNot(landlordId, PropertyStatus.DELETED);

        long totalListings = allProperties.size();
        long activeListings = allProperties.stream()
                .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
                .count();

        // ── Booking stats ──
        long pendingRequests = bookingRepository
                .countByProperty_Landlord_IdAndStatus(
                        landlordId, BookingStatus.PENDING);
        long acceptedRequests = bookingRepository
                .countByProperty_Landlord_IdAndStatus(
                        landlordId, BookingStatus.ACCEPTED);
        long rejectedRequests = bookingRepository
                .countByProperty_Landlord_IdAndStatus(
                        landlordId, BookingStatus.REJECTED);
        long totalRequests = bookingRepository
                .countByProperty_Landlord_Id(landlordId);

        // ── Occupancy ──
        long occupiedUnits = acceptedRequests;
        double occupancyRate = totalListings > 0
                ? Math.round((occupiedUnits * 100.0 / totalListings) * 10.0) / 10.0
                : 0.0;

        // ── Revenue ──
        double totalMonthlyRentPotential = allProperties.stream()
                .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
                .mapToDouble(Property::getRent)
                .sum();
        double averageRentPerListing = activeListings > 0
                ? Math.round((totalMonthlyRentPotential / activeListings) * 100.0) / 100.0
                : 0.0;

        // ── Recent bookings (last 5) ──
        List<DashboardStatsResponse.RecentBooking> recentBookings =
                bookingRepository.findRecentByLandlordId(
                                landlordId, PageRequest.of(0, 5))
                        .stream()
                        .map(b -> DashboardStatsResponse.RecentBooking.builder()
                                .bookingId(b.getId())
                                .tenantName(b.getTenant().getName())
                                .propertyTitle(b.getProperty().getTitle())
                                .status(b.getStatus().name())
                                .createdAt(b.getCreatedAt().toString())
                                .build())
                        .toList();

        // ── Top listings ──
        List<DashboardStatsResponse.PropertySummary> topListings =
                allProperties.stream()
                        .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
                        .map(p -> {
                            String imageUrl = null;
                            try {
                                if (p.getImages() != null && !p.getImages().isEmpty()) {
                                    imageUrl = p.getImages().get(0).getImageUrl();
                                }
                            } catch (Exception ignored) {}

                            Double avgRating = null;
                            try {
                                avgRating = reviewRepository
                                        .findAverageRatingByPropertyId(p.getId());
                                if (avgRating != null) {
                                    avgRating = Math.round(avgRating * 10.0) / 10.0;
                                }
                            } catch (Exception ignored) {}

                            long totalBookings = bookingRepository
                                    .countAllByPropertyId(p.getId());

                            return DashboardStatsResponse.PropertySummary.builder()
                                    .propertyId(p.getId())
                                    .title(p.getTitle())
                                    .locality(p.getLocality())
                                    .rent(p.getRent())
                                    .totalBookings(totalBookings)
                                    .averageRating(avgRating)
                                    .status(p.getStatus().name())
                                    .imageUrl(imageUrl)
                                    .build();
                        })
                        .toList();

        return DashboardStatsResponse.builder()
                .totalListings(totalListings)
                .activeListings(activeListings)
                .pendingRequests(pendingRequests)
                .totalRequests(totalRequests)
                .acceptedRequests(acceptedRequests)
                .rejectedRequests(rejectedRequests)
                .occupiedUnits(occupiedUnits)
                .occupancyRate(occupancyRate)
                .totalMonthlyRentPotential(totalMonthlyRentPotential)
                .averageRentPerListing(averageRentPerListing)
                .recentBookings(recentBookings)
                .topListings(topListings)
                .build();
    }
}