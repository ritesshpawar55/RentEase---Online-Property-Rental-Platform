package com.rentease.backend.controller;

import com.rentease.backend.dto.DashboardStatsResponse;
import com.rentease.backend.service.LandlordDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/landlord")
@RequiredArgsConstructor
public class LandlordDashboardController {

    private final LandlordDashboardService dashboardService;

    private String currentEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication().getName();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboard() {
        return ResponseEntity.ok(
                dashboardService.getDashboardStats(currentEmail()));
    }
}