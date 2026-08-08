package com.rentease.backend.repository;

import com.rentease.backend.entity.BookingRequest;
import com.rentease.backend.enums.BookingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<BookingRequest, Long> {

    List<BookingRequest> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    List<BookingRequest> findByProperty_Landlord_IdOrderByCreatedAtDesc(Long landlordId);

    List<BookingRequest> findByTenantIdAndStatusOrderByCreatedAtDesc(
            Long tenantId, BookingStatus status);

    List<BookingRequest> findByProperty_Landlord_IdAndStatusOrderByCreatedAtDesc(
            Long landlordId, BookingStatus status);

    long countByProperty_Landlord_IdAndStatus(Long landlordId, BookingStatus status);

    boolean existsByTenantIdAndPropertyIdAndStatus(
            Long tenantId, Long propertyId, BookingStatus status);

    // Count all bookings for landlord
    long countByProperty_Landlord_Id(Long landlordId);

    // Recent bookings for landlord (limit via Pageable)
    @Query("SELECT b FROM BookingRequest b " +
            "WHERE b.property.landlord.id = :landlordId " +
            "ORDER BY b.createdAt DESC")
    List<BookingRequest> findRecentByLandlordId(
            @Param("landlordId") Long landlordId,
            Pageable pageable);

    // Count accepted bookings per property
    @Query("SELECT COUNT(b) FROM BookingRequest b " +
            "WHERE b.property.id = :propertyId " +
            "AND b.status = 'ACCEPTED'")
    long countAcceptedByPropertyId(@Param("propertyId") Long propertyId);

    // Count all bookings per property
    @Query("SELECT COUNT(b) FROM BookingRequest b " +
            "WHERE b.property.id = :propertyId")
    long countAllByPropertyId(@Param("propertyId") Long propertyId);

    // Total bookings count
    long count();

    // City-wise booking count
    @Query("SELECT p.city, COUNT(b) FROM BookingRequest b " +
            "JOIN b.property p " +
            "GROUP BY p.city ORDER BY COUNT(b) DESC")
    List<Object[]> countBookingsByCity();

    long countByStatus(BookingStatus status);
}