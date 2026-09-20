package com.rentease.backend.controller;

import com.rentease.backend.dto.WishlistResponse;
import com.rentease.backend.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    private String currentEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication().getName();
    }

    // Toggle — adds if not saved, removes if already saved
    @PostMapping("/{propertyId}")
    public ResponseEntity<Map<String, Object>> toggleWishlist(
            @PathVariable Long propertyId) {
        return ResponseEntity.ok(
                wishlistService.toggleWishlist(propertyId, currentEmail()));
    }

    // Get all saved properties
    @GetMapping
    public ResponseEntity<List<WishlistResponse>> getWishlist() {
        return ResponseEntity.ok(
                wishlistService.getWishlist(currentEmail()));
    }

    // Check if a specific property is wishlisted
    @GetMapping("/{propertyId}/check")
    public ResponseEntity<Map<String, Boolean>> checkWishlist(
            @PathVariable Long propertyId) {
        boolean saved = wishlistService
                .isWishlisted(propertyId, currentEmail());
        return ResponseEntity.ok(Map.of("wishlisted", saved));
    }
}