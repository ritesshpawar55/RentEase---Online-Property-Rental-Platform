package com.rentease.backend.dto;

import com.rentease.backend.enums.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {
    private Long id;
    private String title;
    private String description;
    private String city;
    private String locality;
    private PropertyType propertyType;
    private Integer bhk;
    private Double rent;
    private Double sqft;
    private Integer floor;
    private Integer totalFloors;
    private FurnishingStatus furnishingStatus;
    private PropertyStatus status;
    private Double aiMinRent;
    private Double aiSuggestedRent;
    private Double aiMaxRent;
    private String aiDealBadge; // "FAIR_DEAL", "GREAT_VALUE", "ABOVE_MARKET"
    private LandlordInfo landlord;
    private List<String> imageUrls;
    private Double averageRating;
    private Integer totalReviews;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LandlordInfo {
        private Long id;
        private String name;
        private String phone;
    }

    private List<AmenityInfo> amenities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmenityInfo {
        private Long id;
        private String name;
        private String icon;
    }
}