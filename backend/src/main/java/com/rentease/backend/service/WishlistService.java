package com.rentease.backend.service;

import com.rentease.backend.dto.WishlistResponse;
import com.rentease.backend.entity.Property;
import com.rentease.backend.entity.User;
import com.rentease.backend.entity.Wishlist;
import com.rentease.backend.repository.PropertyRepository;
import com.rentease.backend.repository.UserRepository;
import com.rentease.backend.repository.WishlistRepository;
import com.rentease.backend.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyService propertyService;

    public Map<String, Object> toggleWishlist(Long propertyId, String tenantEmail){
        User tenant = userRepository.findByEmail(tenantEmail).orElseThrow(() -> new RuntimeException("User not found"));

        Property property = propertyRepository.findById(propertyId).orElseThrow(() -> new RuntimeException("Property not found"));

        boolean alreadySaved = wishlistRepository.existsByTenantIdAndPropertyId(tenant.getId(), propertyId);

        if(alreadySaved){
            wishlistRepository.deleteByTenantIdAndPropertyId(tenant.getId(), propertyId);
            return Map.of(
                    "wishlisted", false,
                    "message", "Removed from wishlist"
            );
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .tenant(tenant)
                    .property(property)
                    .build();
            wishlistRepository.save(wishlist);
            return Map.of(
                    "wishlisted", true,
                    "message", "Added to wishlist"
            );
        }
    }

    public List<WishlistResponse> getWishlist(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return wishlistRepository
                .findByTenantIdOrderByCreatedAtDesc(tenant.getId())
                .stream()
                .map(w -> WishlistResponse.builder()
                        .id(w.getId())
                        .savedAt(w.getCreatedAt())
                        .wishlisted(true)
                        .property(propertyService.getPropertyById(
                                w.getProperty().getId()))
                        .build())
                .toList();
    }

    public boolean isWishlisted(Long propertyId, String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return wishlistRepository
                .existsByTenantIdAndPropertyId(tenant.getId(), propertyId);
    }
}

