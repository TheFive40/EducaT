package com.github.net.educat.application;

import java.util.Map;

public interface AppStateService {
    Map<String, String> findByPrefix(String prefix);
    String findByKey(String key);
    String upsert(String key, String value);
    void deleteByKey(String key);
    void deleteByPrefix(String prefix);
}

