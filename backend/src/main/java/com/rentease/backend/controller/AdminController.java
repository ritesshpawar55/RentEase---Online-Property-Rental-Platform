package com.rentease.backend.controller;

import com.rentease.backend.dto.AdminStatsResponse;
import com.rentease.backend.enums.Role;
import com.rentease.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // Platform stats
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    // All users with optional role filter and pagination
    @GetMapping("/users")
    public ResponseEntity<List<AdminStatsResponse.UserSummary>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                adminService.getAllUsers(role, page, size));
    }

    // Search users by name or email
    @GetMapping("/users/search")
    public ResponseEntity<List<AdminStatsResponse.UserSummary>> searchUsers(
            @RequestParam String query) {
        return ResponseEntity.ok(adminService.searchUsers(query));
    }

    // Suspend or activate a user
    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<AdminStatsResponse.UserSummary> toggleUserStatus(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                adminService.toggleUserStatus(userId));
    }

    // Remove a property listing
    @PutMapping("/properties/{propertyId}/suspend")
    public ResponseEntity<Map<String, String>> suspendProperty(
            @PathVariable Long propertyId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null
                ? body.getOrDefault("reason", "Violated platform policies")
                : "Violated platform policies";
        adminService.removeProperty(propertyId, reason);
        return ResponseEntity.ok(
                Map.of("message", "Property suspended successfully"));
    }

    // Delete a review (moderation)
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId) {
        adminService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}