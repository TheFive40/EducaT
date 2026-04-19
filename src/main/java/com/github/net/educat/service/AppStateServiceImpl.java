package com.github.net.educat.service;

import com.github.net.educat.application.AppStateService;
import com.github.net.educat.domain.AppStateEntry;
import com.github.net.educat.repository.AppStateEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppStateServiceImpl implements AppStateService {
    private final AppStateEntryRepository appStateEntryRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> findByPrefix(String prefix) {
        String safePrefix = prefix == null ? "" : prefix.trim();
        List<AppStateEntry> entries = safePrefix.isEmpty()
                ? appStateEntryRepository.findAll()
                : appStateEntryRepository.findByStorageKeyStartingWith(safePrefix);
        Map<String, String> result = new LinkedHashMap<>();
        for (AppStateEntry entry : entries) {
            result.put(entry.getStorageKey(), entry.getStorageValue());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public String findByKey(String key) {
        return appStateEntryRepository.findByStorageKey(key)
                .map(AppStateEntry::getStorageValue)
                .orElse(null);
    }

    @Override
    @Transactional
    public String upsert(String key, String value) {
        AppStateEntry entry = appStateEntryRepository.findByStorageKey(key)
                .orElseGet(() -> AppStateEntry.builder().storageKey(key).build());
        entry.setStorageValue(value);
        return appStateEntryRepository.save(entry).getStorageValue();
    }

    @Override
    @Transactional
    public void deleteByKey(String key) {
        appStateEntryRepository.deleteByStorageKey(key);
    }

    @Override
    @Transactional
    public void deleteByPrefix(String prefix) {
        String safePrefix = prefix == null ? "" : prefix.trim();
        if (safePrefix.isEmpty()) {
            appStateEntryRepository.deleteAll();
            return;
        }
        appStateEntryRepository.deleteByStorageKeyStartingWith(safePrefix);
    }
}

