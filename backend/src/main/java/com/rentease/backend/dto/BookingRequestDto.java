package com.rentease.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequestDto {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotNull(message = "Move-in date is required")
    @FutureOrPresent(message = "Move-in date cannot be in the past")
    private LocalDate moveInDate;

    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;

    // Optional — tenant can propose a counter rent
    @Positive(message = "Counter offer must be positive")
    private Double counterOffer;
}