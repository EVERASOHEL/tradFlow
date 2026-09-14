package com.tradflow.accounting.permission.repository;

import com.tradflow.accounting.permission.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByCode(String code);
    boolean existsByCode(String code);
}
