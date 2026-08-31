package com.rentease.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OtpRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be 6 digits")
    private String otp;
}