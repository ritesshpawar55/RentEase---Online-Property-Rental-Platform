package com.rentease.backend.repository;

import com.rentease.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);

    List<Review> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    Optional<Review> findByTenantIdAndPropertyId(
            Long tenantId, Long propertyId);

    boolean existsByTenantIdAndPropertyId(Long tenantId, Long propertyId);

    @Query("SELECT AVG(r.rating) FROM Review r " +
            "WHERE r.property.id = :propertyId")
    Double findAverageRatingByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT COUNT(r) FROM Review r " +
            "WHERE r.property.id = :propertyId")
    Long countReviewsByPropertyId(@Param("propertyId") Long propertyId);
}