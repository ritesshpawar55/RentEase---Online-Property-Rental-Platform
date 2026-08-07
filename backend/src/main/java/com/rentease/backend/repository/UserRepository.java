package com.rentease.backend.repository;

import com.rentease.backend.entity.User;
import com.rentease.backend.enums.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Count by role
    long countByRole(Role role);

    // Find recent users
    @Query("SELECT u FROM User u ORDER BY u.createdAt DESC")
    List<User> findRecentUsers(Pageable pageable);

    // Find all users with optional role filter
    @Query("SELECT u FROM User u WHERE " +
            "(:role IS NULL OR u.role = :role) " +
            "ORDER BY u.createdAt DESC")
    List<User> findAllByRoleFilter(
            @Param("role") Role role,
            Pageable pageable);

    // Search users by name or email
    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchUsers(@Param("query") String query);

    Optional<User> findByResetToken(String resetToken);
}
