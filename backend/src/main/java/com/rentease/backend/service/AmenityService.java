package com.rentease.backend.service;

import com.rentease.backend.entity.Amenity;
import com.rentease.backend.entity.Property;
import com.rentease.backend.repository.AmenityRepository;
import com.rentease.backend.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AmenityService {

    private final AmenityRepository amenityRepository;
    private final PropertyRepository propertyRepository;

    public List<Amenity> getAllAmenities() {
        return amenityRepository.findAllByOrderByNameAsc();
    }

    public Amenity createAmenity(String name, String icon) {
        if (amenityRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new RuntimeException("Amenity already exists: " + name);
        }
        return amenityRepository.save(
                Amenity.builder().name(name).icon(icon).build());
    }

    public Property addAmenitiesToProperty(Long propertyId,
                                           List<Long> amenityIds,
                                           String landlordEmail) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getLandlord().getEmail().equals(landlordEmail)) {
            throw new RuntimeException("You can only update your own listings");
        }

        List<Amenity> amenities = amenityRepository.findAllById(amenityIds);
        property.setAmenities(amenities);
        return propertyRepository.save(property);
    }

    public void seedDefaultAmenities() {
        List<String[]> defaults = List.of(
                new String[]{"WiFi", "wifi"},
                new String[]{"Parking", "parking"},
                new String[]{"Gym", "gym"},
                new String[]{"Swimming Pool", "pool"},
                new String[]{"Power Backup", "power"},
                new String[]{"Security", "security"},
                new String[]{"Lift", "lift"},
                new String[]{"Air Conditioning", "ac"},
                new String[]{"Water Supply 24/7", "water"},
                new String[]{"Gas Pipeline", "gas"},
                new String[]{"Housekeeping", "housekeeping"},
                new String[]{"CCTV", "cctv"}
        );

        defaults.forEach(a -> {
            if (amenityRepository.findByNameIgnoreCase(a[0]).isEmpty()) {
                amenityRepository.save(
                        Amenity.builder().name(a[0]).icon(a[1]).build());
            }
        });
    }
}