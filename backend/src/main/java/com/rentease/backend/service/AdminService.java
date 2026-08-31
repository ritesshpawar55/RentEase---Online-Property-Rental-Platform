package com.rentease.backend.service;

import com.rentease.backend.dto.*;
import com.rentease.backend.entity.User;
import com.rentease.backend.enums.*;
import com.rentease.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    // ── Platform Stats ──
    public AdminStatsResponse getPlatformStats() {

        // User counts
        long totalUsers = userRepository.count();
        long totalTenants = userRepository.countByRole(Role.TENANT);
        long totalLandlords = userRepository.countByRole(Role.LANDLORD);

        // Property counts
        long totalProperties = propertyRepository.count();
        long activeProperties = propertyRepository
                .countByStatus(PropertyStatus.ACTIVE);

        // Booking counts
        long totalBookings = bookingRepository.count();
        long pendingBookings = bookingRepository
                .countByStatus(BookingStatus.PENDING);

        // Review count
        long totalReviews = reviewRepository.count();

        // City stats
        List<AdminStatsResponse.CityStats> listingsByCity =
                propertyRepository.countListingsByCity()
                        .stream()
                        .map(row -> AdminStatsResponse.CityStats.builder()
                                .city((String) row[0])
                                .count((Long) row[1])
                                .build())
                        .toList();

        List<AdminStatsResponse.CityStats> bookingsByCity =
                bookingRepository.countBookingsByCity()
                        .stream()
                        .map(row -> AdminStatsResponse.CityStats.builder()
                                .city((String) row[0])
                                .count((Long) row[1])
                                .build())
                        .toList();

        // Recent 5 users
        List<AdminStatsResponse.UserSummary> recentUsers =
                userRepository.findRecentUsers(PageRequest.of(0, 5))
                        .stream()
                        .map(this::mapToUserSummary)
                        .toList();

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalTenants(totalTenants)
                .totalLandlords(totalLandlords)
                .totalProperties(totalProperties)
                .activeProperties(activeProperties)
                .totalBookings(totalBookings)
                .pendingBookings(pendingBookings)
                .totalReviews(totalReviews)
                .listingsByCity(listingsByCity)
                .bookingsByCity(bookingsByCity)
                .recentUsers(recentUsers)
                .build();
    }

    // ── Get All Users (with optional role filter) ──
    public List<AdminStatsResponse.UserSummary> getAllUsers(
            Role role, int page, int size) {
        return userRepository
                .findAllByRoleFilter(role, PageRequest.of(page, size))
                .stream()
                .map(this::mapToUserSummary)
                .toList();
    }

    // ── Search Users ──
    public List<AdminStatsResponse.UserSummary> searchUsers(String query) {
        return userRepository.searchUsers(query)
                .stream()
                .map(this::mapToUserSummary)
                .toList();
    }

    // ── Suspend / Activate User ──
    public AdminStatsResponse.UserSummary toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("Cannot suspend an admin account");
        }

        user.setEnabled(!user.isEnabled());
        User saved = userRepository.save(user);
        return mapToUserSummary(saved);
    }

    // ── Remove Property Listing ──
    public void removeProperty(Long propertyId, String reason) {
        propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"))
                .setStatus(PropertyStatus.SUSPENDED);

        propertyRepository.findById(propertyId).ifPresent(p -> {
            p.setStatus(PropertyStatus.SUSPENDED);
            propertyRepository.save(p);
        });
    }

    // ── Delete Review (admin moderation) ──
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new RuntimeException("Review not found");
        }
        reviewRepository.deleteById(reviewId);
    }

    // ── Mapper ──
    private AdminStatsResponse.UserSummary mapToUserSummary(User u) {
        return AdminStatsResponse.UserSummary.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .enabled(u.isEnabled())
                .createdAt(u.getCreatedAt() != null
                        ? u.getCreatedAt().toString() : null)
                .build();
    }
}