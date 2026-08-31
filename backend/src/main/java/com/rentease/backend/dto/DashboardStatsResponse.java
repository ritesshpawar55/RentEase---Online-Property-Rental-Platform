package com.rentease.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    // Overview cards
    private long totalListings;
    private long activeListings;
    private long pendingRequests;
    private long totalRequests;
    private long acceptedRequests;
    private long rejectedRequests;

    // Occupancy
    private long occupiedUnits;
    private double occupancyRate; // percentage

    // Revenue insight
    private double totalMonthlyRentPotential;
    private double averageRentPerListing;

    // Recent activity
    private List<RecentBooking> recentBookings;
    private List<PropertySummary> topListings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentBooking {
        private Long bookingId;
        private String tenantName;
        private String propertyTitle;
        private String status;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertySummary {
        private Long propertyId;
        private String title;
        private String locality;
        private Double rent;
        private long totalBookings;
        private Double averageRating;
        private String status;
        private String imageUrl;
    }
}