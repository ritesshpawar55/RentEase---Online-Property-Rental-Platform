package com.rentease.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    // Platform overview
    private long totalUsers;
    private long totalTenants;
    private long totalLandlords;
    private long totalProperties;
    private long activeProperties;
    private long totalBookings;
    private long pendingBookings;
    private long totalReviews;

    // City breakdown
    private List<CityStats> bookingsByCity;
    private List<CityStats> listingsByCity;

    // Recent users
    private List<UserSummary> recentUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityStats {
        private String city;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private String role;
        private boolean enabled;
        private String createdAt;
    }
}