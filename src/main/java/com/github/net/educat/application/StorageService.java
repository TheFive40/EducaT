package com.github.net.educat.application;

import com.github.net.educat.domain.StoredFile;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface StorageService {
    /**
     * Store a file with deduplication and optional compression.
     * Returns existing StoredFile if hash already exists.
     */
    StoredFile storeFile(MultipartFile file, String entityType, String entityId, String fieldName) throws IOException;

    /**
     * Store bytes directly (for base64 data, etc.)
     */
    StoredFile storeBytes(byte[] data, String fileName, String contentType, String entityType, String entityId, String fieldName) throws IOException;

    /**
     * Download file by stored file ID (auto-decompresses if needed)
     */
    Resource downloadFile(Integer storedFileId);

    /**
     * Get stored file metadata
     */
    StoredFile getStoredFile(Integer id);

    /**
     * Delete a file reference. If reference count reaches 0, deletes the actual file.
     */
    void deleteFileReference(Integer storedFileId, String entityType, String entityId);

    /**
     * Delete all references for an entity
     */
    void deleteEntityReferences(String entityType, String entityId);

    /**
     * Get total storage used in bytes (compressed size)
     */
    long getTotalStorageUsed();

    /**
     * Get total number of unique files
     */
    long getTotalFilesCount();

    /**
     * List orphaned files (reference count = 0)
     */
    List<StoredFile> findOrphanedFiles();

    /**
     * Get compression ratio statistics
     */
    double getCompressionRatio();

    /**
     * Re-compress a PDF by lowering internal image quality.
     * Returns the compressed bytes, or original bytes if compression fails.
     */
    byte[] compressPdf(byte[] data);
}
