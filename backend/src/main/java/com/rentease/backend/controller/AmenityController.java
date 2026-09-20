package com.rentease.backend.controller;

import com.rentease.backend.entity.Amenity;
import com.rentease.backend.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping
    public ResponseEntity<List<Amenity>> getAllAmenities() {
        return ResponseEntity.ok(amenityService.getAllAmenities());
    }

    @PostMapping("/property/{propertyId}")
    public ResponseEntity<?> addAmenitiesToProperty(
            @PathVariable Long propertyId,
            @RequestBody Map<String, List<Long>> body) {
        String email = org.springframework.security.core.context
                .SecurityContextHolder.getContext()
                .getAuthentication().getName();
        amenityService.addAmenitiesToProperty(
                propertyId, body.get("amenityIds"), email);
        return ResponseEntity.ok(
                Map.of("message", "Amenities updated successfully"));
    }
}