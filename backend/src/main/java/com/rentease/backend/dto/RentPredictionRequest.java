package com.rentease.backend.dto;

import lombok.Data;

@Data
public class RentPredictionRequest {
    private Integer bhk;
    private Double sqft;
    private Integer floor;
    private Integer furnished; // 0=unfurnished, 1=semi, 2=furnished
    private Integer bathrooms;
    private String city;
    private String locality;
}