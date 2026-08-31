package com.rentease.backend.service;

import com.rentease.backend.dto.*;
import com.rentease.backend.entity.*;
import com.rentease.backend.enums.BookingStatus;
import com.rentease.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;

    public ReviewResponse createReview(ReviewRequest request,
                                       String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // Gate — only tenants with accepted booking can review
        boolean hasAcceptedBooking = bookingRepository
                .existsByTenantIdAndPropertyIdAndStatus(
                        tenant.getId(),
                        property.getId(),
                        BookingStatus.ACCEPTED);

        if (!hasAcceptedBooking) {
            throw new RuntimeException(
                    "You can only review a property after " +
                            "your booking has been accepted");
        }

        // One review per tenant per property
        if (reviewRepository.existsByTenantIdAndPropertyId(
                tenant.getId(), property.getId())) {
            throw new RuntimeException(
                    "You have already reviewed this property");
        }

        Review review = Review.builder()
                .tenant(tenant)
                .property(property)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return mapToResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getPropertyReviews(Long propertyId) {
        return reviewRepository
                .findByPropertyIdOrderByCreatedAtDesc(propertyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ReviewResponse> getMyReviews(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return reviewRepository
                .findByTenantIdOrderByCreatedAtDesc(tenant.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ReviewResponse updateReview(Long reviewId,
                                       ReviewRequest request,
                                       String tenantEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getTenant().getEmail().equals(tenantEmail)) {
            throw new RuntimeException(
                    "You can only edit your own reviews");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return mapToResponse(reviewRepository.save(review));
    }

    public void deleteReview(Long reviewId, String tenantEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getTenant().getEmail().equals(tenantEmail)) {
            throw new RuntimeException(
                    "You can only delete your own reviews");
        }

        reviewRepository.delete(review);
    }

    public Double getAverageRating(Long propertyId) {
        Double avg = reviewRepository
                .findAverageRatingByPropertyId(propertyId);
        return avg != null
                ? Math.round(avg * 10.0) / 10.0
                : null;
    }

    public Long getReviewCount(Long propertyId) {
        return reviewRepository.countReviewsByPropertyId(propertyId);
    }

    private ReviewResponse mapToResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .tenant(ReviewResponse.TenantInfo.builder()
                        .id(r.getTenant().getId())
                        .name(r.getTenant().getName())
                        .build())
                .property(ReviewResponse.PropertyInfo.builder()
                        .id(r.getProperty().getId())
                        .title(r.getProperty().getTitle())
                        .city(r.getProperty().getCity())
                        .build())
                .build();
    }
}