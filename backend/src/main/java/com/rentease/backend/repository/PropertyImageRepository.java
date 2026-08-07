package com.rentease.backend.repository;

import com.rentease.backend.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    List<PropertyImage> findByPropertyId(Long propertyId);
    void deleteByPropertyId(Long propertyId);
}