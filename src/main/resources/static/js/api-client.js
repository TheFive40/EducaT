/**
 * Central API Client for EducaT
 * NO localStorage, NO sessionStorage
 * All data comes from backend, cached in memory only
 * Auto-sync every 5-10 seconds for critical data
 */
(function() {
    if (window.EducaTAPI) return;

    const API_BASE = (window.location && window.location.origin) ? window.location.origin : 'http://localhost:8080';
    const API_ROOT = API_BASE + '/api';
    const CACHE_TTL = 5000; // 5 seconds
    const SYNC_INTERVAL = 10000; // 10 seconds for polling
    
    const cache = new Map();
    const syncTimers = new Map();
    let authToken = '';

    /**
     * Reads auth token from sessionStorage (only for authentication)
     * Does NOT store app data in storage
     */
    function getAuthToken() {
        try {
            const token = sessionStorage.getItem('educat_auth') || '';
            return token ? ((/^(Basic|Bearer)\s+/i.test(token)) ? token : 'Basic ' + token) : '';
        } catch (e) {
            return '';
        }
    }

    /**
     * Build headers with authentication
     */
    function buildHeaders(isJson = true) {
        const headers = {};
        if (isJson) headers['Content-Type'] = 'application/json';
        const auth = getAuthToken();
        if (auth) headers['Authorization'] = auth;
        return headers;
    }

    /**
     * Make authenticated fetch request
     */
    async function fetchAPI(url, options = {}) {
        const mergedOptions = {
            ...options,
            headers: { ...buildHeaders(options.json !== false), ...(options.headers || {}) }
        };

        try {
            const response = await fetch(url, mergedOptions);
            if (response.status === 401 || response.status === 403) {
                window.location.href = API_BASE + '/login';
                return null;
            }
            if (!response.ok) {
                console.error(`API Error: ${response.status} ${response.statusText}`);
                return null;
            }
            return options.text === true ? await response.text() : await response.json();
        } catch (error) {
            console.error('API Fetch Error:', error);
            return null;
        }
    }

    /**
     * Get from cache if not expired
     */
    function getFromCache(key) {
        if (!cache.has(key)) return null;
        const { data, expiry } = cache.get(key);
        if (Date.now() > expiry) {
            cache.delete(key);
            return null;
        }
        return data;
    }

    /**
     * Store in cache with TTL
     */
    function setInCache(key, data, ttl = CACHE_TTL) {
        cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    /**
     * Clear cache for specific pattern
     */
    function clearCache(pattern) {
        for (const key of cache.keys()) {
            if (key.match(pattern)) {
                cache.delete(key);
            }
        }
    }

    // ============ COURSES API ============
    const CoursesAPI = {
        /**
         * Get all courses for current user
         */
        async getMyCoursesForRole() {
            const cacheKey = 'courses:my';
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/courses/my`);
            if (data) setInCache(cacheKey, data);
            return data || [];
        },

        /**
         * Get course by ID
         */
        async getCourse(courseId) {
            const cacheKey = `course:${courseId}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/courses/${courseId}`);
            if (data) setInCache(cacheKey, data);
            return data;
        },

        /**
         * Get course units
         */
        async getUnits(courseId) {
            const cacheKey = `course:${courseId}:units`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/courses/${courseId}/units`);
            if (data) setInCache(cacheKey, data);
            return data || [];
        }
    };

    // ============ ACTIVITIES API ============
    const ActivitiesAPI = {
        /**
         * Get activities for a course
         */
        async getActivities(courseId, unitId = null) {
            const params = new URLSearchParams();
            params.append('courseId', courseId);
            if (unitId) params.append('unitId', unitId);
            
            const cacheKey = `activities:course:${courseId}:unit:${unitId}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/activities?${params}`);
            if (data) setInCache(cacheKey, data);
            return data || [];
        },

        /**
         * Get activity by ID
         */
        async getActivity(activityId) {
            const cacheKey = `activity:${activityId}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/activities/${activityId}`);
            if (data) setInCache(cacheKey, data);
            return data;
        },

        /**
         * Create or update activity
         */
        async saveActivity(activity) {
            const url = activity.id 
                ? `${API_ROOT}/activities/${activity.id}`
                : `${API_ROOT}/activities`;
            
            const method = activity.id ? 'PUT' : 'POST';
            const data = await fetchAPI(url, {
                method,
                body: JSON.stringify(activity)
            });
            
            if (data) {
                clearCache(/activities:/);
                setInCache(`activity:${data.id}`, data);
            }
            return data;
        }
    };

    // ============ EVALUATION SUBMISSIONS API ============
    const SubmissionsAPI = {
        /**
         * Get submissions filtered (for teacher viewing student submissions)
         */
        async getSubmissions(filters = {}) {
            const params = new URLSearchParams();
            if (filters.courseId) params.append('courseId', filters.courseId);
            if (filters.activityId) params.append('activityId', filters.activityId);
            if (filters.studentId) params.append('studentId', filters.studentId);
            if (filters.submitted !== undefined) params.append('submitted', filters.submitted);
            if (filters.page) params.append('page', filters.page);
            if (filters.size) params.append('size', filters.size);
            
            const cacheKey = `submissions:${JSON.stringify(filters)}`;
            // Don't cache submissions for long due to real-time updates
            const cached = getFromCache(cacheKey);
            if (cached && Date.now() - cached.timestamp < 3000) return cached.data;

            const data = await fetchAPI(`${API_ROOT}/teacher/evaluation-submissions?${params}`);
            if (data) {
                setInCache(cacheKey, { data, timestamp: Date.now() }, 3000);
            }
            return data;
        },

        /**
         * Get student's submissions
         */
        async getMySubmissions(filters = {}) {
            const params = new URLSearchParams();
            if (filters.courseId) params.append('courseId', filters.courseId);
            if (filters.page) params.append('page', filters.page);
            if (filters.size) params.append('size', filters.size);
            
            const cacheKey = `mysubmissions:${JSON.stringify(filters)}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/student/evaluation-submissions?${params}`);
            if (data) setInCache(cacheKey, data);
            return data;
        },

        /**
         * Submit evaluation (student)
         */
        async submitEvaluation(submission) {
            const data = await fetchAPI(`${API_ROOT}/student/evaluation-submissions`, {
                method: 'POST',
                body: JSON.stringify(submission)
            });
            
            if (data) {
                clearCache(/submissions:/);
                clearCache(/mysubmissions:/);
            }
            return data;
        },

        /**
         * Grade submission (teacher)
         */
        async gradeSubmission(submissionId, grade, feedback) {
            const data = await fetchAPI(`${API_ROOT}/teacher/evaluation-submissions/${submissionId}/grade`, {
                method: 'PUT',
                body: JSON.stringify({ grade, feedback })
            });
            
            if (data) {
                clearCache(/submissions:/);
            }
            return data;
        }
    };

    // ============ GRADES API ============
    const GradesAPI = {
        /**
         * Get grades for a course (teacher view)
         */
        async getGrades(courseId, page = 1, pageSize = 8) {
            const params = new URLSearchParams();
            params.append('courseId', courseId);
            params.append('page', page);
            params.append('size', pageSize);
            
            const cacheKey = `grades:course:${courseId}:page:${page}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/teacher/grades?${params}`);
            if (data) setInCache(cacheKey, data, 3000);
            return data;
        },

        /**
         * Get my grades (student view)
         */
        async getMyGrades(courseId = null) {
            const params = new URLSearchParams();
            if (courseId) params.append('courseId', courseId);
            
            const cacheKey = `myGrades:${courseId}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/student/grades?${params}`);
            if (data) setInCache(cacheKey, data);
            return data;
        }
    };

    // ============ ATTENDANCE API ============
    const AttendanceAPI = {
        /**
         * Get attendance for course and date (teacher)
         */
        async getAttendanceByDate(courseId, date) {
            const cacheKey = `attendance:${courseId}:${date}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/teacher/attendance?courseId=${courseId}&date=${date}`);
            if (data) setInCache(cacheKey, data, 3000);
            return data;
        },

        /**
         * Save attendance for course and date
         */
        async saveAttendance(courseId, date, attendance) {
            const data = await fetchAPI(`${API_ROOT}/teacher/attendance`, {
                method: 'POST',
                body: JSON.stringify({ courseId, date, attendance })
            });
            
            if (data) {
                clearCache(/attendance:/);
            }
            return data;
        }
    };

    // ============ SCHEDULE API ============
    const ScheduleAPI = {
        /**
         * Get schedules for current user
         */
        async getMySchedule() {
            const cacheKey = 'schedule:my';
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/schedules/my`);
            if (data) setInCache(cacheKey, data, CACHE_TTL);
            return data || [];
        },

        /**
         * Get course schedule
         */
        async getCourseSchedule(courseId) {
            const cacheKey = `schedule:course:${courseId}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/schedules?courseId=${courseId}`);
            if (data) setInCache(cacheKey, data, CACHE_TTL);
            return data || [];
        }
    };

    // ============ ENROLLMENTS API ============
    const EnrollmentsAPI = {
        /**
         * Get my enrollments
         */
        async getMyEnrollments() {
            const cacheKey = 'enrollments:my';
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/student/enrollments`);
            if (data) setInCache(cacheKey, data);
            return data || [];
        },

        /**
         * Get students enrolled in course
         */
        async getCourseStudents(courseId) {
            const cacheKey = `enrollments:course:${courseId}`;
            const cached = getFromCache(cacheKey);
            if (cached) return cached;

            const data = await fetchAPI(`${API_ROOT}/courses/${courseId}/students`);
            if (data) setInCache(cacheKey, data);
            return data || [];
        }
    };

    // ============ AUTO-SYNC MECHANISM ============
    /**
     * Start auto-sync for critical data
     * Useful for real-time updates without WebSockets
     */
    function startAutoSync(syncKey, syncFn, interval = SYNC_INTERVAL) {
        if (syncTimers.has(syncKey)) return; // Already syncing
        
        const timer = setInterval(() => {
            syncFn();
        }, interval);
        
        syncTimers.set(syncKey, timer);
    }

    /**
     * Stop auto-sync
     */
    function stopAutoSync(syncKey) {
        if (syncTimers.has(syncKey)) {
            clearInterval(syncTimers.get(syncKey));
            syncTimers.delete(syncKey);
        }
    }

    // ============ PUBLIC API ============
    window.EducaTAPI = {
        // Cache management
        clearCache,
        getFromCache,
        setInCache,
        
        // Auth
        getAuthToken,
        
        // API sections
        courses: CoursesAPI,
        activities: ActivitiesAPI,
        submissions: SubmissionsAPI,
        grades: GradesAPI,
        attendance: AttendanceAPI,
        schedule: ScheduleAPI,
        enrollments: EnrollmentsAPI,
        
        // Sync management
        startAutoSync,
        stopAutoSync,
        
        // Generic fetch
        fetch: fetchAPI
    };

})();

