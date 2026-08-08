package com.rentease.backend.repository;

import com.rentease.backend.entity.Property;
import com.rentease.backend.enums.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    // Search with filters
    @Query("SELECT p FROM Property p WHERE p.status = 'ACTIVE'" +
            " AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))" +
            " AND (:bhk IS NULL OR p.bhk = :bhk)" +
            " AND (:minRent IS NULL OR p.rent >= :minRent)" +
            " AND (:maxRent IS NULL OR p.rent <= :maxRent)" +
            " AND (:furnished IS NULL OR p.furnishingStatus = :furnished)" +
            " AND (:propertyType IS NULL OR p.propertyType = :propertyType)")
    Page<Property> searchProperties(
            @Param("city") String city,
            @Param("bhk") Integer bhk,
            @Param("minRent") Double minRent,
            @Param("maxRent") Double maxRent,
            @Param("furnished") FurnishingStatus furnished,
            @Param("propertyType") PropertyType propertyType,
            Pageable pageable
    );

    // Get all properties by landlord
    List<Property> findByLandlordIdAndStatusNot(
            Long landlordId, PropertyStatus status);

    // Count active properties by landlord
    long countByLandlordIdAndStatus(Long landlordId, PropertyStatus status);

    // Count active properties
    long countByStatus(PropertyStatus status);

    // City-wise listing count
    @Query("SELECT p.city, COUNT(p) FROM Property p " +
            "WHERE p.status = 'ACTIVE' " +
            "GROUP BY p.city ORDER BY COUNT(p) DESC")
    List<Object[]> countListingsByCity();
}