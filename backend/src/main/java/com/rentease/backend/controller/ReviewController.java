package com.rentease.backend.controller;

import com.rentease.backend.dto.*;
import com.rentease.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    private String currentEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication().getName();
    }

    // Tenant submits a review
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(
                reviewService.createReview(request, currentEmail()));
    }

    // Public — anyone can read property reviews
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<ReviewResponse>> getPropertyReviews(
            @PathVariable Long propertyId) {
        return ResponseEntity.ok(
                reviewService.getPropertyReviews(propertyId));
    }

    // Tenant — get own reviews
    @GetMapping("/my-reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews() {
        return ResponseEntity.ok(
                reviewService.getMyReviews(currentEmail()));
    }

    // Tenant — edit own review
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(
                reviewService.updateReview(reviewId, request, currentEmail()));
    }

    // Tenant — delete own review
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId, currentEmail());
        return ResponseEntity.noContent().build();
    }
}