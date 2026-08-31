package com.rentease.backend.service;

import com.rentease.backend.dto.*;
import com.rentease.backend.entity.*;
import com.rentease.backend.enums.*;
import com.rentease.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final SseService sseService;
    private final ReviewRepository reviewRepository;
    private final AiPredictionService aiPredictionService;

    public PropertyResponse createProperty(PropertyRequest request, String landlordEmail) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new RuntimeException("Landlord not found"));

        if (landlord.getRole() != Role.LANDLORD) {
            throw new RuntimeException("Only landlords can create listings");
        }

        Property property = Property.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .city(request.getCity())
                .locality(request.getLocality())
                .propertyType(request.getPropertyType())
                .bhk(request.getBhk())
                .rent(request.getRent())
                .sqft(request.getSqft())
                .floor(request.getFloor())
                .totalFloors(request.getTotalFloors())
                .furnishingStatus(request.getFurnishingStatus())
                .status(PropertyStatus.ACTIVE)
                .landlord(landlord)
                .build();

        Property saved = propertyRepository.save(property);
        cacheAiPrediction(saved);
        sseService.broadcastNewListing(mapToResponse(saved));
        return mapToResponse(saved);
    }

    public Page<PropertyResponse> searchProperties(
            String city, Integer bhk, Double minRent, Double maxRent,
            FurnishingStatus furnished, PropertyType propertyType,
            int page, int size, String sortBy) {

        Sort sort = switch (sortBy != null ? sortBy : "newest") {
            case "rent_asc" -> Sort.by("rent").ascending();
            case "rent_desc" -> Sort.by("rent").descending();
            default -> Sort.by("createdAt").descending();
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        return propertyRepository.searchProperties(
                        city, bhk, minRent, maxRent, furnished, propertyType, pageable)
                .map(this::mapToResponse);
    }

    public PropertyResponse getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return mapToResponse(property);
    }

    public PropertyResponse updateProperty(Long id, PropertyRequest request,
                                           String landlordEmail) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getLandlord().getEmail().equals(landlordEmail)) {
            throw new RuntimeException("You can only edit your own listings");
        }

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setCity(request.getCity());
        property.setLocality(request.getLocality());
        property.setPropertyType(request.getPropertyType());
        property.setBhk(request.getBhk());
        property.setRent(request.getRent());
        property.setSqft(request.getSqft());
        property.setFloor(request.getFloor());
        property.setTotalFloors(request.getTotalFloors());
        property.setFurnishingStatus(request.getFurnishingStatus());

        Property updated = propertyRepository.save(property);
        cacheAiPrediction(updated);
        return mapToResponse(updated);
    }

    public void deleteProperty(Long id, String landlordEmail) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getLandlord().getEmail().equals(landlordEmail)) {
            throw new RuntimeException("You can only delete your own listings");
        }

        property.setStatus(PropertyStatus.DELETED);
        propertyRepository.save(property);
    }

    public List<PropertyResponse> getLandlordProperties(String landlordEmail) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new RuntimeException("Landlord not found"));

        return propertyRepository
                .findByLandlordIdAndStatusNot(landlord.getId(), PropertyStatus.DELETED)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private PropertyResponse mapToResponse(Property p) {
        String badge = null;
        if (p.getAiSuggestedRent() != null) {
            double diff = ((p.getRent() - p.getAiSuggestedRent())
                    / p.getAiSuggestedRent()) * 100;
            if (diff > 10) badge = "ABOVE_MARKET";
            else if (diff < -10) badge = "GREAT_VALUE";
            else badge = "FAIR_DEAL";
        }

        List<String> imageUrls;
        try {
            imageUrls = p.getImages() != null
                    ? p.getImages().stream()
                    .map(PropertyImage::getImageUrl)
                    .toList()
                    : List.of();
        } catch (Exception e) {
            imageUrls = List.of();
        }

        List<PropertyResponse.AmenityInfo> amenityInfos;
        try {
            amenityInfos = p.getAmenities() != null
                    ? p.getAmenities().stream()
                    .map(a -> PropertyResponse.AmenityInfo.builder()
                            .id(a.getId())
                            .name(a.getName())
                            .icon(a.getIcon())
                            .build())
                    .toList()
                    : List.of();
        } catch (Exception e) {
            amenityInfos = List.of();
        }

        // Fetch rating and review count
        Double avgRating = getAverageRating(p.getId());
        Integer reviewCount = getReviewCount(p.getId());

        return PropertyResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .city(p.getCity())
                .locality(p.getLocality())
                .propertyType(p.getPropertyType())
                .bhk(p.getBhk())
                .rent(p.getRent())
                .sqft(p.getSqft())
                .floor(p.getFloor())
                .totalFloors(p.getTotalFloors())
                .furnishingStatus(p.getFurnishingStatus())
                .status(p.getStatus())
                .aiMinRent(p.getAiMinRent())
                .aiSuggestedRent(p.getAiSuggestedRent())
                .aiMaxRent(p.getAiMaxRent())
                .aiDealBadge(badge)
                .landlord(PropertyResponse.LandlordInfo.builder()
                        .id(p.getLandlord().getId())
                        .name(p.getLandlord().getName())
                        .phone(p.getLandlord().getPhone())
                        .build())
                .imageUrls(imageUrls)
                .amenities(amenityInfos)
                .averageRating(avgRating)
                .totalReviews(reviewCount)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private Double getAverageRating(Long propertyId) {
        try {
            Double avg = reviewRepository
                    .findAverageRatingByPropertyId(propertyId);
            return avg != null ? Math.round(avg * 10.0) / 10.0 : null;
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getReviewCount(Long propertyId) {
        try {
            Long count = reviewRepository
                    .countReviewsByPropertyId(propertyId);
            return count != null ? count.intValue() : null;
        } catch (Exception e) {
            return null;
        }
    }


    private void cacheAiPrediction(Property property) {
        try {
            RentPredictionRequest request =
                    new RentPredictionRequest();
            request.setBhk(property.getBhk());
            request.setSqft(property.getSqft());
            request.setFloor(property.getFloor());
            request.setFurnished(
                    property.getFurnishingStatus().ordinal());
            request.setBathrooms(property.getBhk());
            request.setCity(property.getCity());
            request.setLocality(property.getLocality());

            RentPredictionResponse prediction =
                    aiPredictionService.predictRent(request);

            property.setAiMinRent(
                    prediction.getMinRent().doubleValue());
            property.setAiSuggestedRent(
                    prediction.getSuggested().doubleValue());
            property.setAiMaxRent(
                    prediction.getMaxRent().doubleValue());

            propertyRepository.save(property);
            log.info("AI prediction cached for property {}",
                    property.getId());
        } catch (Exception e) {
            log.warn("AI prediction failed for property {}: {}",
                    property.getId(), e.getMessage());
        }
    }

}