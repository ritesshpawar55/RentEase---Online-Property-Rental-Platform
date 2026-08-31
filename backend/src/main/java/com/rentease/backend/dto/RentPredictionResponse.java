package com.rentease.backend.dto;

import lombok.Data;

@Data
public class RentPredictionResponse {
    private Integer minRent;
    private Integer suggested;
    private Integer maxRent;
    private String currency;
    private String city;
    private String aiDealBadge;
    private String note;
}