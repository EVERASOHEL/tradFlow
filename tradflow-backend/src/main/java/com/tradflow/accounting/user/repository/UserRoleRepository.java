package com.tradflow.accounting.user.repository;

import com.tradflow.accounting.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    List<UserRole> findByUserId(UUID userId);
    List<UserRole> findByUserIdAndActiveTrue(UUID userId);
    Optional<UserRole> findByUserIdAndRoleId(UUID userId, UUID roleId);
    boolean existsByUserIdAndRoleId(UUID userId, UUID roleId);

    @Query("""
            select count(distinct ur.user.id)
            from UserRole ur
            where ur.active = true
              and ur.user.active = true
              and ur.user.accountLocked = false
              and ur.role.active = true
              and ur.role.code = :roleCode
            """)
    long countActiveUnlockedUsersWithRole(@Param("roleCode") String roleCode);
}
