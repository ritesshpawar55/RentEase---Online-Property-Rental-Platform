package com.rentease.backend.dto;

import com.rentease.backend.enums.BookingStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private LocalDate moveInDate;
    private String message;
    private Double counterOffer;
    private String counterOfferBy;
    private String responseMessage;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private PropertySummary property;
    private PersonInfo tenant;
    private PersonInfo landlord;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertySummary {
        private Long id;
        private String title;
        private String city;
        private String locality;
        private Double rent;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonInfo {
        private Long id;
        private String name;
        private String phone;
        private String email;
    }
}