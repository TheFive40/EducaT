package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "storage_quotas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "owner_type", nullable = false, length = 30)
    private String ownerType;

    @Column(name = "owner_id", nullable = false, length = 60)
    private String ownerId;

    @Column(name = "bytes_used", nullable = false)
    @Builder.Default
    private Long bytesUsed = 0L;

    @Column(name = "bytes_limit", nullable = false)
    @Builder.Default
    private Long bytesLimit = 0L;

    @Column(name = "files_count")
    @Builder.Default
    private Integer filesCount = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        if (bytesUsed == null) bytesUsed = 0L;
        if (bytesLimit == null) bytesLimit = 0L;
        if (filesCount == null) filesCount = 0;
    }
}
