package com.rentease.backend.dto;

import com.rentease.backend.enums.BookingStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BookingStatusUpdateDto {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    @Size(max = 1000, message = "Response message cannot exceed 1000 characters")
    private String responseMessage;

    // Landlord can counter the tenant's counter-offer
    @Positive(message = "Counter offer must be positive")
    private Double counterOffer;
}