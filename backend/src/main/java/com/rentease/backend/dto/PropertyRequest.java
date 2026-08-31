package com.rentease.backend.dto;

import com.rentease.backend.enums.*;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PropertyRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Locality is required")
    private String locality;

    @NotNull(message = "Property type is required")
    private PropertyType propertyType;

    @NotNull(message = "BHK is required")
    @Min(value = 1, message = "BHK must be at least 1")
    @Max(value = 10, message = "BHK cannot exceed 10")
    private Integer bhk;

    @NotNull(message = "Rent is required")
    @Min(value = 1000, message = "Rent must be at least ₹1000")
    private Double rent;

    @NotNull(message = "Size is required")
    @Min(value = 100, message = "Size must be at least 100 sqft")
    private Double sqft;

    @NotNull(message = "Floor is required")
    private Integer floor;

    private Integer totalFloors;

    @NotNull(message = "Furnishing status is required")
    private FurnishingStatus furnishingStatus;
}