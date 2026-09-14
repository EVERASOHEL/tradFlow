package com.tradflow.accounting.common.audit;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Base class for entities that only track created_at (no updated_at column),
 * e.g. permissions, user_roles, role_permissions.
 */
@Getter
@Setter
@MappedSuperclass
public abstract class CreatedAtOnly {

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
