package com.rentease.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrderResponse {

    private String razorpayOrderId;
    private Double amount;
    private String currency;
    private String keyId;
    private Long bookingId;
    private String propertyTitle;
    private String tenantName;
    private String tenantEmail;
}