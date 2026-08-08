package com.rentease.backend.repository;

import com.rentease.backend.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    Optional<Wishlist> findByTenantIdAndPropertyId(Long tenantId, Long propertyId);

    boolean existsByTenantIdAndPropertyId(Long tenantId, Long propertyId);

    void deleteByTenantIdAndPropertyId(Long tenantId, Long propertyId);

    long countByPropertyId(Long propertyId);
}