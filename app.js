/**
 * ========================================================================
 *   EduGraph — Student Performance Analytics Dashboard Logic
 *   Framework: Pure JavaScript (ES6) + Chart.js
 * ========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let students = [];
    let filteredStudents = [];
    let currentTab = 'dashboard';
    
    // Filters State
    let filterSearch = '';
    let filterGrade = 'all';
    let filterStatus = 'all';
    
    // Pagination State
    let currentPage = 1;
    const itemsPerPage = 8;
    
    // Sorting State
    let sortColumn = 'name';
    let sortDirection = 'asc'; // 'asc' or 'desc'
    
    // Chart Instances (to destroy/update)
    let charts = {
        gradeDist: null,
        subjectRadar: null,
        attendanceScatter: null,
        termProgression: null
    };

    // --- DOM Elements ---
    const tabPanes = document.querySelectorAll('.tab-pane');
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitleHeading = document.getElementById('page-title-heading');
    
    // Filters & Actions
    const searchInput = document.getElementById('search-student');
    const gradeSelect = document.getElementById('filter-grade');
    const statusSelect = document.getElementById('filter-status');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const btnExport = document.getElementById('btn-export');
    const btnAddStudent = document.getElementById('btn-add-student');
    
    // Overview KPIs
    const kpiTotalStudents = document.getElementById('kpi-total-students');
    const kpiClassAvg = document.getElementById('kpi-class-avg');
    const kpiClassAvgGrade = document.getElementById('kpi-class-avg-grade');
    const kpiAttendance = document.getElementById('kpi-attendance');
    const kpiAttendanceStatus = document.getElementById('kpi-attendance-status');
    const kpiAtRisk = document.getElementById('kpi-at-risk');
    const kpiAtRiskPct = document.getElementById('kpi-at-risk-pct');
    
    // Students Directory
    const studentTableBody = document.getElementById('student-table-body');
    const displayedStudentsCount = document.getElementById('displayed-students-count');
    const totalStudentsCount = document.getElementById('total-students-count');
    const emptyState = document.getElementById('empty-state');
    const btnClearSearch = document.getElementById('btn-clear-search');
    
    // Pagination
    const pagiPrev = document.getElementById('pagi-prev');
    const pagiNext = document.getElementById('pagi-next');
    const pagiNumbers = document.getElementById('pagi-numbers');
    const totalPagesSpan = document.getElementById('total-pages');
    const currentPageSpan = document.getElementById('current-page');
    
    // Deep Dive Analytics elements
    const subjectsProficiency = document.getElementById('subjects-proficiency');
    const riskTableBody = document.getElementById('risk-table-body');
    const atRiskBadgeCount = document.getElementById('at-risk-badge-count');
    
    // Statistical Metrics
    const metricMedian = document.getElementById('metric-median');
    const metricStdDev = document.getElementById('metric-stddev');
    const metricP90 = document.getElementById('metric-p90');
    const metricPassRate = document.getElementById('metric-pass-rate');
    const metricAttendanceCompliance = document.getElementById('metric-attendance-compliance');

    // Modals
    const modalAddOverlay = document.getElementById('modal-add-student-overlay');
    const addStudentForm = document.getElementById('add-student-form');
    const modalAddClose = document.getElementById('modal-add-close');
    const btnAddCancel = document.getElementById('btn-add-cancel');
    
    const modalDetailsOverlay = document.getElementById('modal-details-overlay');
    const modalDetailsClose = document.getElementById('modal-details-close');
    const btnDetailsCloseFooter = document.getElementById('btn-details-close-footer');
    const studentDetailsContent = document.getElementById('student-details-content');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // --- Mock Data Engine ---
    const initialMockNames = [
        "Alexander Davis", "Sophia Martinez", "Liam Johnson", "Olivia Rodriguez", 
        "Noah Smith", "Ava Williams", "Ethan Brown", "Isabella Jones", 
        "Mason Miller", "Mia Garcia", "Logan Wilson", "Charlotte Anderson", 
        "Lucas Taylor", "Amelia Thomas", "Oliver Moore", "Harper Jackson", 
        "Elijah Martin", "Evelyn Lee", "James Thompson", "Abigail White", 
        "Benjamin Harris", "Emily Sanchez", "Lucas Clark", "Elizabeth Ramirez", 
        "Henry Lewis", "Sofia Robinson", "Jacob Walker", "Avery Young", 
        "Michael Allen", "Ella King", "Daniel Wright", "Madison Scott", 
        "Jackson Torres", "Scarlett Nguyen", "William Hill"
    ];

    function generateMockData() {
        const generated = [];
        // Hardcode a seed-based generator to make it consistent but natural
        for (let i = 0; i < initialMockNames.length; i++) {
            const name = initialMockNames[i];
            const grade = 9 + (i % 3); // 9, 10, or 11
            
            // Attendance percentage - semi correlated with index to spread values
            // Create some struggling, some average, some top-tier students
            let attendance;
            if (i === 4 || i === 12 || i === 22 || i === 31) {
                attendance = Math.round(62 + Math.random() * 12); // Low attendance outliers (62% - 74%)
            } else {
                attendance = Math.round(82 + Math.random() * 16); // Normal range (82% - 98%)
            }

            // Scores correlated with attendance
            const attendanceFactor = attendance / 100;
            
            // Generate subject scores (0-100)
            const math = Math.min(100, Math.max(20, Math.round(attendanceFactor * 90 + (Math.random() - 0.5) * 20)));
            const science = Math.min(100, Math.max(30, Math.round(attendanceFactor * 88 + (Math.random() - 0.45) * 22)));
            const english = Math.min(100, Math.max(40, Math.round(attendanceFactor * 85 + (Math.random() - 0.5) * 25)));
            const history = Math.min(100, Math.max(35, Math.round(attendanceFactor * 82 + (Math.random() - 0.5) * 20)));
            const art = Math.min(100, Math.max(50, Math.round(75 + (Math.random() - 0.4) * 25))); // Art is less attendance-dependent

            // Calculate overall current average (term 3 current score)
            const overallAverage = Math.round((math + science + english + history + art) / 5);

            // Historical terms average (shows progression trends)
            // Generally show term improvement or decline based on status
            let term1, term2;
            if (overallAverage > 80) {
                term1 = overallAverage - Math.round(Math.random() * 8);
                term2 = overallAverage - Math.round(Math.random() * 4);
            } else if (overallAverage < 60) {
                term1 = overallAverage + Math.round(Math.random() * 6);
                term2 = overallAverage + Math.round(Math.random() * 3);
            } else {
                term1 = overallAverage + Math.round((Math.random() - 0.5) * 6);
                term2 = overallAverage + Math.round((Math.random() - 0.5) * 4);
            }

            generated.push({
                id: `STU${String(i + 1).padStart(3, '0')}`,
                name: name,
                grade: grade,
                attendance: attendance,
                scores: {
                    math: Math.max(0, math),
                    science: Math.max(0, science),
                    english: Math.max(0, english),
                    history: Math.max(0, history),
                    art: Math.max(0, art)
                },
                terms: [Math.max(0, Math.round(term1)), Math.max(0, Math.round(term2)), overallAverage],
                average: overallAverage
            });
        }
        return generated;
    }

    // Initialize Students Data from localStorage or generate fresh
    function initializeData() {
        const cached = localStorage.getItem('edugraph_students');
        if (cached) {
            try {
                students = JSON.parse(cached);
            } catch (e) {
                console.error("Error reading cache, rebuilding...", e);
                students = generateMockData();
                localStorage.setItem('edugraph_students', JSON.stringify(students));
            }
        } else {
            students = generateMockData();
            localStorage.setItem('edugraph_students', JSON.stringify(students));
        }
        filteredStudents = [...students];
    }

    // Save current students list back to localStorage
    function saveData() {
        localStorage.setItem('edugraph_students', JSON.stringify(students));
    }

    // --- Helper Utilities ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        else if (type === 'danger') icon = 'fa-circle-exclamation';
        else if (type === 'warning') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${icon} toast-icon"></i>
            <div class="toast-content">${message}</div>
        `;
        toastContainer.appendChild(toast);
        
        // Remove toast from DOM after animations end
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    function getGradeLetter(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    function isAtRisk(student) {
        return student.average < 60 || student.attendance < 75;
    }

    // --- Date/Time Indicator ---
    function updateDateTime() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const now = new Date();
        // Since local time in metadata is 2026, let's keep a nice formatted string
        document.getElementById('current-date-time').textContent = now.toLocaleDateString('en-US', options);
    }

    // --- Tab Management ---
    function switchTab(tabId) {
        currentTab = tabId;
        
        // Update header heading
        if (tabId === 'dashboard') {
            pageTitleHeading.textContent = 'Student Performance Analytics';
        } else if (tabId === 'directory') {
            pageTitleHeading.textContent = 'Students Directory Roster';
        } else if (tabId === 'analytics') {
            pageTitleHeading.textContent = 'Analytics & Intervention Deep Dive';
        }

        // Toggle Active nav element
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle view panels
        tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabId}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Re-render components if transitioning to specific tabs
        if (tabId === 'dashboard') {
            updateCharts();
        } else if (tabId === 'directory') {
            renderStudentTable();
        } else if (tabId === 'analytics') {
            renderAnalyticsDeepDive();
        }
    }

    // --- Filtering Logic ---
    function applyFilters() {
        filterSearch = searchInput.value.toLowerCase().trim();
        filterGrade = gradeSelect.value;
        filterStatus = statusSelect.value;

        filteredStudents = students.filter(student => {
            // Search text filter
            const matchesSearch = student.name.toLowerCase().includes(filterSearch);
            
            // Grade level filter
            const matchesGrade = filterGrade === 'all' || student.grade === parseInt(filterGrade);
            
            // Status filter
            let matchesStatus = true;
            if (filterStatus === 'passing') {
                matchesStatus = student.average >= 60;
            } else if (filterStatus === 'at-risk') {
                matchesStatus = isAtRisk(student);
            }

            return matchesSearch && matchesGrade && matchesStatus;
        });

        currentPage = 1; // Reset to page 1 on filter trigger
        
        // Re-execute calculations and refresh views
        calculateOverviewKPIs();
        
        if (currentTab === 'dashboard') {
            updateCharts();
        } else if (currentTab === 'directory') {
            renderStudentTable();
        } else if (currentTab === 'analytics') {
            renderAnalyticsDeepDive();
        }
    }

    function resetFilters() {
        searchInput.value = '';
        gradeSelect.value = 'all';
        statusSelect.value = 'all';
        applyFilters();
        showToast("Filters reset to default view.", "info");
    }

    // --- Overview KPI calculations ---
    function calculateOverviewKPIs() {
        const total = filteredStudents.length;
        kpiTotalStudents.textContent = total;

        if (total === 0) {
            kpiClassAvg.textContent = '0.0%';
            kpiClassAvgGrade.textContent = '-';
            kpiClassAvgGrade.className = 'kpi-trend';
            kpiAttendance.textContent = '0.0%';
            kpiAttendanceStatus.textContent = 'N/A';
            kpiAttendanceStatus.className = 'kpi-trend';
            kpiAtRisk.textContent = '0';
            kpiAtRiskPct.textContent = '0.0%';
            return;
        }

        // 1. Class Average Score
        const avgScore = filteredStudents.reduce((sum, s) => sum + s.average, 0) / total;
        kpiClassAvg.textContent = `${avgScore.toFixed(1)}%`;
        
        const letter = getGradeLetter(avgScore);
        kpiClassAvgGrade.textContent = letter;
        kpiClassAvgGrade.className = `kpi-trend ${letter === 'F' ? 'trend-down' : 'trend-up'}`;

        // 2. Attendance Average
        const avgAttendance = filteredStudents.reduce((sum, s) => sum + s.attendance, 0) / total;
        kpiAttendance.textContent = `${avgAttendance.toFixed(1)}%`;
        
        let statusStr = "Optimal";
        let statusClass = "trend-up";
        if (avgAttendance < 75) {
            statusStr = "Critical";
            statusClass = "trend-down";
        } else if (avgAttendance < 85) {
            statusStr = "Warning";
            statusClass = "badge-warning"; // warning color
        }
        kpiAttendanceStatus.textContent = statusStr;
        kpiAttendanceStatus.className = `kpi-trend ${statusClass}`;

        // 3. At Risk Students
        const atRiskCount = filteredStudents.filter(isAtRisk).length;
        const atRiskPct = (atRiskCount / total) * 100;
        kpiAtRisk.textContent = atRiskCount;
        kpiAtRiskPct.textContent = `${atRiskPct.toFixed(1)}%`;
        
        if (atRiskCount > 0) {
            kpiAtRiskPct.className = 'kpi-trend trend-down';
        } else {
            kpiAtRiskPct.className = 'kpi-trend trend-up';
        }
    }

    // --- Chart.js Data Visualizations ---
    function updateCharts() {
        if (filteredStudents.length === 0) {
            // If empty, clear data or show empty charts
            Object.values(charts).forEach(c => {
                if (c) {
                    c.data.datasets.forEach(dataset => dataset.data = []);
                    c.update();
                }
            });
            return;
        }

        initGradeDistChart();
        initSubjectRadarChart();
        initAttendanceScatterChart();
        initTermProgressionChart();
    }

    // Chart 1: Grade Distribution (Bar)
    function initGradeDistChart() {
        const ctx = document.getElementById('chart-grade-dist').getContext('2d');
        
        // Count grades
        const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        filteredStudents.forEach(s => {
            const letter = getGradeLetter(s.average);
            gradeCounts[letter]++;
        });

        const chartData = [gradeCounts.A, gradeCounts.B, gradeCounts.C, gradeCounts.D, gradeCounts.F];

        if (charts.gradeDist) {
            charts.gradeDist.data.datasets[0].data = chartData;
            charts.gradeDist.update();
            return;
        }

        charts.gradeDist = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
                datasets: [{
                    label: 'Number of Students',
                    data: chartData,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.65)',  // Emerald
                        'rgba(59, 130, 246, 0.65)',  // Blue
                        'rgba(129, 140, 248, 0.65)', // Indigo-light
                        'rgba(245, 158, 11, 0.65)',  // Warning/Amber
                        'rgba(239, 68, 68, 0.65)'    // Danger/Rose
                    ],
                    borderColor: [
                        '#10b981',
                        '#3b82f6',
                        '#818cf8',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1e293b',
                        bodyColor: '#64748b',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#64748b' },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' }
                    },
                    x: {
                        ticks: { color: '#64748b' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Chart 2: Subject Strengths (Radar)
    function initSubjectRadarChart() {
        const ctx = document.getElementById('chart-subject-radar').getContext('2d');
        const subjects = ['math', 'science', 'english', 'history', 'art'];
        const total = filteredStudents.length;

        const subjectAverages = subjects.map(sub => {
            const sum = filteredStudents.reduce((acc, s) => acc + s.scores[sub], 0);
            return Math.round(sum / total);
        });

        if (charts.subjectRadar) {
            charts.subjectRadar.data.datasets[0].data = subjectAverages;
            charts.subjectRadar.update();
            return;
        }

        charts.subjectRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Mathematics', 'Science', 'English', 'History', 'Fine Arts'],
                datasets: [{
                    label: 'Class Average (%)',
                    data: subjectAverages,
                    backgroundColor: 'rgba(79, 70, 229, 0.15)',
                    borderColor: '#4f46e5',
                    pointBackgroundColor: '#4f46e5',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#4f46e5',
                    borderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1e293b',
                        bodyColor: '#64748b',
                        padding: 10
                    }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(226, 232, 240, 0.8)' },
                        grid: { color: 'rgba(226, 232, 240, 0.8)' },
                        pointLabels: { color: '#1e293b', font: { weight: '500' } },
                        ticks: { backdropColor: 'transparent', color: '#64748b' },
                        suggestedMin: 40,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    // Chart 3: Attendance vs Performance (Scatter Plot)
    function initAttendanceScatterChart() {
        const ctx = document.getElementById('chart-attendance-scatter').getContext('2d');
        
        const scatterPoints = filteredStudents.map(s => ({
            x: s.attendance,
            y: s.average,
            studentName: s.name // Custom field for tooltip
        }));

        if (charts.attendanceScatter) {
            charts.attendanceScatter.data.datasets[0].data = scatterPoints;
            charts.attendanceScatter.update();
            return;
        }

        charts.attendanceScatter = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Students',
                    data: scatterPoints,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3b82f6',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1e293b',
                        bodyColor: '#64748b',
                        borderColor: 'rgba(79, 70, 229, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const pt = context.raw;
                                return [
                                    `Name: ${pt.studentName}`,
                                    `Attendance: ${pt.x}%`,
                                    `Overall average: ${pt.y}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Attendance Rate (%)', color: '#64748b', font: { weight: '500' } },
                        ticks: { color: '#64748b' },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        suggestedMin: 50,
                        suggestedMax: 100
                    },
                    y: {
                        title: { display: true, text: 'Average Score (%)', color: '#64748b', font: { weight: '500' } },
                        ticks: { color: '#64748b' },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        suggestedMin: 30,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    // Chart 4: Term Progression (Line Chart)
    function initTermProgressionChart() {
        const ctx = document.getElementById('chart-term-progression').getContext('2d');
        const total = filteredStudents.length;

        // Calculate average for Term 1, Term 2, Term 3
        const avgTerm1 = filteredStudents.reduce((sum, s) => sum + s.terms[0], 0) / total;
        const avgTerm2 = filteredStudents.reduce((sum, s) => sum + s.terms[1], 0) / total;
        const avgTerm3 = filteredStudents.reduce((sum, s) => sum + s.terms[2], 0) / total;

        const chartData = [Math.round(avgTerm1), Math.round(avgTerm2), Math.round(avgTerm3)];

        if (charts.termProgression) {
            charts.termProgression.data.datasets[0].data = chartData;
            charts.termProgression.update();
            return;
        }

        charts.termProgression = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Term 1', 'Term 2', 'Term 3 (Current)'],
                datasets: [{
                    label: 'Class Average',
                    data: chartData,
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: '#10b981',
                    tension: 0.35,
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1e293b',
                        bodyColor: '#64748b',
                        padding: 10
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#64748b' },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        suggestedMin: 60,
                        suggestedMax: 90
                    },
                    x: {
                        ticks: { color: '#64748b' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- Students Directory Tab Renders ---
    function renderStudentTable() {
        // Apply sorting
        let sorted = [...filteredStudents];
        sorted.sort((a, b) => {
            let valA, valB;
            if (sortColumn === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            } else if (sortColumn === 'grade') {
                valA = a.grade;
                valB = b.grade;
            } else if (sortColumn === 'average') {
                valA = a.average;
                valB = b.average;
            } else if (sortColumn === 'attendance') {
                valA = a.attendance;
                valB = b.attendance;
            } else if (sortColumn === 'status') {
                valA = isAtRisk(a) ? 1 : 0;
                valB = isAtRisk(b) ? 1 : 0;
            }
            
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Set counts
        totalStudentsCount.textContent = students.length;
        displayedStudentsCount.textContent = sorted.length;

        if (sorted.length === 0) {
            studentTableBody.innerHTML = '';
            emptyState.classList.remove('hidden');
            document.querySelector('.table-pagination').style.display = 'none';
            return;
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('.table-pagination').style.display = 'flex';
        }

        // Pagination indices
        const totalPages = Math.ceil(sorted.length / itemsPerPage);
        totalPagesSpan.textContent = totalPages;
        
        // Ensure currentPage sits within bounds
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        currentPageSpan.textContent = currentPage;

        pagiPrev.disabled = currentPage === 1;
        pagiNext.disabled = currentPage === totalPages;

        // Slice data for active page
        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageData = sorted.slice(startIdx, startIdx + itemsPerPage);

        // Render rows
        studentTableBody.innerHTML = pageData.map(student => {
            // Find strengths and weakness subjects
            const subEntries = Object.entries(student.scores);
            subEntries.sort((a, b) => b[1] - a[1]);
            const strongSub = subEntries[0][0].substring(0, 3).toUpperCase();
            const weakSub = subEntries[subEntries.length - 1][0].substring(0, 3).toUpperCase();

            // Status Badge HTML
            let statusBadge = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Passing</span>`;
            if (student.average < 60) {
                statusBadge = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Academic Risk</span>`;
            } else if (student.attendance < 75) {
                statusBadge = `<span class="badge badge-warning"><i class="fa-solid fa-user-clock"></i> Attendance Risk</span>`;
            }

            // Create dicebear avatar string
            const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundType=gradientLinear`;

            return `
                <tr>
                    <td>
                        <div class="sidebar-user" style="gap: 10px;">
                            <img src="${avatarUrl}" alt="Avatar" class="user-avatar" style="width: 32px; height: 32px; border-radius: var(--border-radius-sm);">
                            <span class="user-name" style="font-size: 0.88rem;">${student.name}</span>
                        </div>
                    </td>
                    <td>Grade ${student.grade}</td>
                    <td>
                        <strong style="color: ${student.average >= 60 ? 'inherit' : 'var(--danger)'};">
                            ${student.average}%
                        </strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 4px;">
                            (${getGradeLetter(student.average)})
                        </span>
                    </td>
                    <td>
                        <span style="color: ${student.attendance >= 75 ? 'inherit' : 'var(--danger)'}; font-weight: 500;">
                            ${student.attendance}%
                        </span>
                    </td>
                    <td>
                        <div class="subject-pills">
                            <span class="pill pill-high"><i class="fa-solid fa-arrow-up-right"></i> ${strongSub}: ${subEntries[0][1]}</span>
                            <span class="pill pill-low"><i class="fa-solid fa-arrow-down-left"></i> ${weakSub}: ${subEntries[subEntries.length - 1][1]}</span>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-view" onclick="viewStudentDetails('${student.id}')" title="View Profile">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteStudent('${student.id}')" title="Delete Student">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Build pagination numbers
        renderPaginationControls(totalPages);
        updateSortIndicators();
    }

    function renderPaginationControls(totalPages) {
        pagiNumbers.innerHTML = '';
        const maxVisible = 4;
        
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const numBtn = document.createElement('button');
            numBtn.className = `pagi-num ${i === currentPage ? 'active' : ''}`;
            numBtn.textContent = i;
            numBtn.addEventListener('click', () => {
                currentPage = i;
                renderStudentTable();
            });
            pagiNumbers.appendChild(numBtn);
        }
    }

    function updateSortIndicators() {
        const headers = document.querySelectorAll('.students-table th.sortable');
        headers.forEach(h => {
            const colName = h.getAttribute('data-sort');
            const icon = h.querySelector('i');
            
            if (colName === sortColumn) {
                h.style.color = 'var(--primary)';
                if (sortDirection === 'asc') {
                    icon.className = 'fa-solid fa-arrow-down-short-wide';
                } else {
                    icon.className = 'fa-solid fa-arrow-up-wide-short';
                }
            } else {
                h.style.color = '';
                icon.className = 'fa-solid fa-sort';
            }
        });
    }

    // --- Analytics Deep Dive Tab ---
    function renderAnalyticsDeepDive() {
        const total = filteredStudents.length;
        if (total === 0) {
            subjectsProficiency.innerHTML = '<p class="text-muted">No data available for filters.</p>';
            riskTableBody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align: center;">No intervention requirements found.</td></tr>';
            atRiskBadgeCount.textContent = '0 Students';
            
            metricMedian.textContent = '0.0%';
            metricStdDev.textContent = '0.0%';
            metricP90.textContent = '0.0%';
            metricPassRate.textContent = '0.0%';
            metricAttendanceCompliance.textContent = '0.0%';
            return;
        }

        // 1. Calculate Proficiencies
        const subjects = ['math', 'science', 'english', 'history', 'art'];
        const subLabels = {
            math: 'Mathematics',
            science: 'Natural Science',
            english: 'English & Literature',
            history: 'Historical Studies',
            art: 'Fine Arts & Design'
        };

        const subjectProficiencies = subjects.map(sub => {
            const scores = filteredStudents.map(s => s.scores[sub]);
            const average = scores.reduce((sum, v) => sum + v, 0) / total;
            const passingCount = scores.filter(s => s >= 60).length;
            const passingRate = (passingCount / total) * 100;
            return {
                id: sub,
                name: subLabels[sub],
                average: Math.round(average),
                passingRate: Math.round(passingRate)
            };
        });

        // Sort by highest average performance
        subjectProficiencies.sort((a, b) => b.average - a.average);

        subjectsProficiency.innerHTML = subjectProficiencies.map(sub => {
            return `
                <div class="subject-item-detailed">
                    <div class="subject-label-row">
                        <span class="subject-label-name">${sub.name}</span>
                        <span class="subject-label-stats">Mean: <span>${sub.average}%</span> | Passing: <span>${sub.passingRate}%</span></span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${sub.average}%; background: ${sub.average >= 75 ? 'var(--primary-gradient)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}"></div>
                    </div>
                </div>
            `;
        }).join('');

        // 2. Statistical Calculations
        const allAverages = filteredStudents.map(s => s.average).sort((a, b) => a - b);
        
        // Median
        let median;
        const mid = Math.floor(allAverages.length / 2);
        if (allAverages.length % 2 !== 0) {
            median = allAverages[mid];
        } else {
            median = (allAverages[mid - 1] + allAverages[mid]) / 2;
        }
        metricMedian.textContent = `${median.toFixed(1)}%`;

        // Standard Deviation
        const mean = allAverages.reduce((sum, v) => sum + v, 0) / total;
        const variance = allAverages.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / total;
        const stdDev = Math.sqrt(variance);
        metricStdDev.textContent = `${stdDev.toFixed(1)}%`;

        // 90th Percentile (using Nearest Rank method)
        const p90Index = Math.max(0, Math.ceil(0.9 * allAverages.length) - 1);
        const p90Val = allAverages[p90Index];
        metricP90.textContent = `${p90Val.toFixed(1)}%`;

        // Passing Rate (Overall Avg >= 60)
        const overallPass = filteredStudents.filter(s => s.average >= 60).length;
        const passPct = (overallPass / total) * 100;
        metricPassRate.textContent = `${passPct.toFixed(1)}%`;

        // Attendance Compliance Rate (Attendance >= 75)
        const compliantAttendance = filteredStudents.filter(s => s.attendance >= 75).length;
        const compliancePct = (compliantAttendance / total) * 100;
        metricAttendanceCompliance.textContent = `${compliancePct.toFixed(1)}%`;

        // 3. Render Risk & Intervention List
        const atRiskStudents = filteredStudents.filter(isAtRisk);
        
        // Sort risk severity (Lower average/attendance first)
        atRiskStudents.sort((a, b) => {
            const scoreGapA = Math.max(0, 60 - a.average) + Math.max(0, 75 - a.attendance);
            const scoreGapB = Math.max(0, 60 - b.average) + Math.max(0, 75 - b.attendance);
            return scoreGapB - scoreGapA; // Highest severity first
        });

        atRiskBadgeCount.textContent = `${atRiskStudents.length} Students`;

        if (atRiskStudents.length === 0) {
            riskTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-muted" style="text-align: center; padding: 30px;">
                        <i class="fa-solid fa-circle-check text-success" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                        All active filtered students meet standard academic and attendance compliance thresholds.
                    </td>
                </tr>
            `;
            return;
        }

        riskTableBody.innerHTML = atRiskStudents.map(student => {
            // Urgency
            let urgencyBadge = `<span class="urgency-badge urgency-medium">Medium</span>`;
            if (student.average < 50 || student.attendance < 65) {
                urgencyBadge = `<span class="urgency-badge urgency-high">Urgent Intervention</span>`;
            }

            // Primary Risk Category
            let primaryRisk = "Academic Failure";
            if (student.average >= 60 && student.attendance < 75) {
                primaryRisk = "Chronic Absence";
            } else if (student.average < 60 && student.attendance < 75) {
                primaryRisk = "Dual (Academic & Absence)";
            }

            const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`;

            return `
                <tr>
                    <td>
                        <div class="sidebar-user" style="gap: 10px;">
                            <img src="${avatarUrl}" alt="Avatar" class="user-avatar" style="width: 32px; height: 32px; border-radius: var(--border-radius-sm);">
                            <span class="user-name" style="font-size: 0.88rem;">${student.name}</span>
                        </div>
                    </td>
                    <td>Grade ${student.grade}</td>
                    <td><strong class="text-danger">${student.average}%</strong> (${getGradeLetter(student.average)})</td>
                    <td><span class="${student.attendance < 75 ? 'text-danger' : ''}">${student.attendance}%</span></td>
                    <td><span style="font-size: 0.8rem; font-weight: 600;">${primaryRisk}</span></td>
                    <td>${urgencyBadge}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="viewStudentDetails('${student.id}')">
                            <i class="fa-solid fa-user-gear"></i> Intervention Plan
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- Modal Control Functions ---
    function openModal(modal) {
        modal.classList.add('open');
    }

    function closeModal(modal) {
        modal.classList.remove('open');
    }

    // --- Add New Student logic ---
    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('new-name').value.trim();
        const grade = parseInt(document.getElementById('new-grade').value);
        const attendance = parseInt(document.getElementById('new-attendance').value);
        
        // Subject scores
        const scores = {
            math: parseInt(document.getElementById('score-math').value),
            science: parseInt(document.getElementById('score-science').value),
            english: parseInt(document.getElementById('score-english').value),
            history: parseInt(document.getElementById('score-history').value),
            art: parseInt(document.getElementById('score-art').value)
        };

        const overallAverage = Math.round((scores.math + scores.science + scores.english + scores.history + scores.art) / 5);

        // Term scores
        const terms = [
            parseInt(document.getElementById('score-term1').value),
            parseInt(document.getElementById('score-term2').value),
            overallAverage
        ];

        const nextIdNum = students.length > 0 ? Math.max(...students.map(s => parseInt(s.id.replace('STU', '')))) + 1 : 1;
        const newStudent = {
            id: `STU${String(nextIdNum).padStart(3, '0')}`,
            name,
            grade,
            attendance,
            scores,
            terms,
            average: overallAverage
        };

        students.push(newStudent);
        saveData();
        
        // Close modal and reset form
        closeModal(modalAddOverlay);
        addStudentForm.reset();
        
        // Notify
        showToast(`Successfully added student ${name}!`, "success");
        
        // Reload dashboard
        applyFilters();
    });

    // --- Export Data to CSV ---
    function exportToCSV() {
        if (filteredStudents.length === 0) {
            showToast("No student data available to export.", "warning");
            return;
        }

        const headers = ["Student ID", "Full Name", "Grade Level", "Attendance (%)", "Math Score", "Science Score", "English Score", "History Score", "Fine Arts Score", "Overall Average (%)", "Grade Letter", "Status"];
        
        const rows = filteredStudents.map(s => {
            const status = isAtRisk(s) ? 'At Risk' : 'Passing';
            const letter = getGradeLetter(s.average);
            return [
                s.id,
                `"${s.name}"`, // Quote names to avoid commas breaking format
                s.grade,
                s.attendance,
                s.scores.math,
                s.scores.science,
                s.scores.english,
                s.scores.history,
                s.scores.art,
                s.average,
                letter,
                status
            ];
        });

        // Join to standard CSV structure
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        // Trigger file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `edugraph_student_report_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Exported report containing ${filteredStudents.length} entries successfully!`, "success");
    }

    // --- Global Click Event Listeners ---
    
    // Tab Clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Filter controls
    searchInput.addEventListener('input', applyFilters);
    gradeSelect.addEventListener('change', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
    
    btnResetFilters.addEventListener('click', resetFilters);
    btnClearSearch.addEventListener('click', resetFilters);

    // Header actions
    btnExport.addEventListener('click', exportToCSV);
    btnAddStudent.addEventListener('click', () => openModal(modalAddOverlay));
    
    // Modal Close Triggers
    modalAddClose.addEventListener('click', () => closeModal(modalAddOverlay));
    btnAddCancel.addEventListener('click', () => closeModal(modalAddOverlay));
    
    modalDetailsClose.addEventListener('click', () => closeModal(modalDetailsOverlay));
    btnDetailsCloseFooter.addEventListener('click', () => closeModal(modalDetailsOverlay));

    // Outside click closes modals
    window.addEventListener('click', (e) => {
        if (e.target === modalAddOverlay) closeModal(modalAddOverlay);
        if (e.target === modalDetailsOverlay) closeModal(modalDetailsOverlay);
    });

    // Table Header Sorting Click
    const tableHeaders = document.querySelectorAll('.students-table th.sortable');
    tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-sort');
            if (sortColumn === col) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = col;
                sortDirection = 'asc';
            }
            renderStudentTable();
        });
    });

    // Pagination Button Clicks
    pagiPrev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderStudentTable();
        }
    });

    pagiNext.addEventListener('click', () => {
        // Calculate max page dynamically
        const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderStudentTable();
        }
    });

    // --- Expose window functions for onclick elements ---
    window.deleteStudent = function(studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Custom premium confirm instead of native confirm
        if (confirm(`Are you sure you want to remove student "${student.name}" from the system? This action is permanent.`)) {
            students = students.filter(s => s.id !== studentId);
            saveData();
            showToast(`Deleted ${student.name}'s records.`, "danger");
            applyFilters();
        }
    };

    window.viewStudentDetails = function(studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Calculate strengths and weakness
        const subList = Object.entries(student.scores);
        subList.sort((a, b) => b[1] - a[1]);
        
        const subLabels = {
            math: 'Mathematics',
            science: 'Natural Science',
            english: 'English & Lit.',
            history: 'History Studies',
            art: 'Fine Arts'
        };

        // Custom recommendations based on data
        let recommendations = "";
        let strengths = "";
        
        if (student.average >= 85) {
            strengths = `Academic standout in multiple subjects. Excels in ${subLabels[subList[0][0]]}.`;
            recommendations = "Recommend enrolment in high-honors classes or research workshops. Suitable for peer-tutoring leadership roles.";
        } else if (student.average < 60) {
            strengths = `Demonstrates primary strengths in ${subLabels[subList[0][0]]} (${subList[0][1]}%).`;
            recommendations = `Needs immediate academic recovery pathway in ${subLabels[subList[subList.length-1][0]]}. Align with tutor and establish weekly goals.`;
        } else {
            strengths = `Solid performer. Strongest output in ${subLabels[subList[0][0]]} (${subList[0][1]}%).`;
            recommendations = `Focus on reinforcing study habits in ${subLabels[subList[subList.length-1][0]]} to raise cumulative grade point average.`;
        }

        if (student.attendance < 75) {
            recommendations += ` <br><strong style="color: var(--danger)">ATTENDANCE ALERT:</strong> Attendance at ${student.attendance}% is below school thresholds. Mandatory parental consult advised.`;
        }

        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundType=gradientLinear`;

        // Render modal content
        studentDetailsContent.innerHTML = `
            <div class="student-profile-summary">
                <img src="${avatarUrl}" alt="Avatar" class="student-profile-avatar">
                <div class="student-profile-meta">
                    <h3>${student.name}</h3>
                    <div class="student-meta-badges">
                        <span class="badge badge-success" style="background: rgba(79, 70, 229, 0.1); color: var(--primary)">Grade ${student.grade}</span>
                        <span class="badge ${student.average >= 60 ? 'badge-success' : 'badge-danger'}">Avg: ${student.average}% (${getGradeLetter(student.average)})</span>
                        <span class="badge ${student.attendance >= 75 ? 'badge-success' : 'badge-danger'}">Attendance: ${student.attendance}%</span>
                    </div>
                </div>
            </div>

            <div class="student-profile-grid">
                <!-- Subject Breakdowns -->
                <div class="profile-card-section">
                    <h4>Subject Competencies</h4>
                    <div class="profile-stats-list">
                        ${subList.map(([sub, score]) => {
                            let barColor = 'var(--primary-gradient)';
                            if (score < 60) barColor = 'var(--danger-gradient)';
                            else if (score < 80) barColor = 'linear-gradient(135deg, #f59e0b, #d97706)';

                            return `
                                <div class="profile-stat-bar-group">
                                    <div class="profile-stat-label-row">
                                        <span>${subLabels[sub]}</span>
                                        <span>${score}% (${getGradeLetter(score)})</span>
                                    </div>
                                    <div class="progress-track" style="height: 6px;">
                                        <div class="progress-fill" style="width: ${score}%; background: ${barColor};"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Circular Attendance gauge & Action items -->
                <div class="profile-card-section" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h4>Attendance & Insights</h4>
                        <div class="profile-radial-gauge-container">
                            <div class="profile-gauge-chart">
                                <!-- Draw canvas circular indicator -->
                                <canvas id="attendance-donut-canvas" width="140" height="140"></canvas>
                                <div class="profile-gauge-value">${student.attendance}%</div>
                            </div>
                        </div>
                    </div>

                    <div class="insights-box">
                        <strong>Academic Insights</strong>
                        <span>${strengths} ${recommendations}</span>
                    </div>
                </div>
            </div>
        `;

        openModal(modalDetailsOverlay);

        // Draw the circular progress on the canvas
        // Wait a tick for DOM rendering to initialize context
        setTimeout(() => {
            const canvas = document.getElementById('attendance-donut-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const x = canvas.width / 2;
                const y = canvas.height / 2;
                const radius = 60;
                
                // Clear
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Base grey ring
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
                ctx.lineWidth = 10;
                ctx.stroke();
                
                // Active Colored Ring
                const percentage = student.attendance / 100;
                ctx.beginPath();
                // Arc starts from top (1.5 * Math.PI) and goes clockwise
                ctx.arc(x, y, radius, 1.5 * Math.PI, (1.5 + 2 * percentage) * Math.PI);
                
                // Color mapping
                ctx.strokeStyle = student.attendance >= 90 ? '#10b981' : (student.attendance >= 75 ? '#3b82f6' : '#ef4444');
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }, 50);
    };    // --- WELCOME LANDING PAGE CONTROLLER ---
    const landingPage = document.getElementById('landing-page');
    const appWorkspace = document.getElementById('app-workspace');
    const btnLandingStart = document.getElementById('btn-landing-start');
    const btnLandingExplore = document.getElementById('btn-landing-explore');
    const btnLandingLogin = document.getElementById('btn-landing-login');
    const sidebarLogo = document.querySelector('.sidebar-brand');
    const landingNavLinks = document.querySelectorAll('.landing-nav-link');

    // Enter workspace transition
    function enterWorkspace(targetTab = 'dashboard') {
        landingPage.classList.add('hidden');
        appWorkspace.style.display = 'flex';
        
        // Trigger reflow to initiate opacity transition
        setTimeout(() => {
            appWorkspace.classList.add('visible');
            switchTab(targetTab);
        }, 50);
    }

    // Leave workspace transition (back to welcome page)
    function returnToLanding() {
        appWorkspace.classList.remove('visible');
        
        setTimeout(() => {
            appWorkspace.style.display = 'none';
            landingPage.classList.remove('hidden');
            runCounterAnimation(); // Re-trigger count animation
        }, 500);
    }

    // Event hooks for entering
    btnLandingStart.addEventListener('click', () => {
        enterWorkspace('dashboard');
        showToast("Welcome to EduGraph Workspace!", "success");
    });
    
    btnLandingExplore.addEventListener('click', () => {
        enterWorkspace('dashboard');
    });

    btnLandingLogin.addEventListener('click', () => {
        showToast("Logged in as Prof. Henderson", "success");
        enterWorkspace('dashboard');
    });

    // Sidebar logo click goes back to welcome portal
    sidebarLogo.style.cursor = 'pointer';
    sidebarLogo.addEventListener('click', returnToLanding);

    // Landing header links jump straight to dashboard tabs
    landingNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            enterWorkspace(tabId);
        });
    });

    // Stat Numbers Counter Animation
    function runCounterAnimation() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            counter.textContent = '0';
            const target = parseInt(counter.getAttribute('data-target'));
            const suffix = counter.getAttribute('data-suffix') || '';
            const duration = 1200; // ms
            const stepTime = 15; // ms
            const totalSteps = duration / stepTime;
            const increment = target / totalSteps;
            
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString() + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString() + suffix;
                }
            }, stepTime);
        });
    }
    // CSV Import Elements
    const btnDownloadTemplate = document.getElementById('btn-download-template');
    const btnUploadLandingTrigger = document.getElementById('btn-upload-landing-trigger');
    const btnExploreLandingPortal = document.getElementById('btn-explore-landing-portal');
    const landingCsvFileInput = document.getElementById('landing-csv-file-input');
    
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const workspaceCsvFileInput = document.getElementById('workspace-csv-file-input');

    if (btnDownloadTemplate) btnDownloadTemplate.addEventListener('click', downloadCSVTemplate);
    
    if (btnUploadLandingTrigger) {
        btnUploadLandingTrigger.addEventListener('click', () => {
            landingCsvFileInput.click();
        });
    }
    
    if (landingCsvFileInput) {
        landingCsvFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importCSVData(e.target.files[0], true); // true = landing import (redirects)
            }
        });
    }
    
    if (btnExploreLandingPortal) {
        btnExploreLandingPortal.addEventListener('click', () => {
            enterWorkspace('dashboard');
        });
    }
    
    if (btnImportTrigger) {
        btnImportTrigger.addEventListener('click', () => {
            workspaceCsvFileInput.click();
        });
    }
    
    if (workspaceCsvFileInput) {
        workspaceCsvFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importCSVData(e.target.files[0], false); // false = workspace import (stays)
            }
        });
    }

    function downloadCSVTemplate() {
        const templateHeaders = ["Full Name", "Grade Level", "Attendance (%)", "Math Score", "Science Score", "English Score", "History Score", "Fine Arts Score"];
        const templateRows = [
            ["Alexander Davis", "9", "92", "85", "88", "76", "80", "90"],
            ["Sophia Martinez", "10", "64", "45", "52", "68", "60", "72"],
            ["Liam Johnson", "11", "98", "94", "96", "88", "92", "95"]
        ];
        const csvContent = [templateHeaders.join(','), ...templateRows.map(r => r.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "edugraph_csv_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast("CSV template downloaded!", "success");
    }

    function importCSVData(file, isLanding = false) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const parsed = parseCSV(text);
            if (parsed.length === 0) {
                showToast("Could not parse CSV. Please ensure formatting matches our template.", "danger");
                return;
            }
            students = parsed;
            saveData();
            filteredStudents = [...students];
            
            // Re-calculate everything
            calculateOverviewKPIs();
            updateCharts();
            currentPage = 1;
            renderStudentTable();
            renderRiskDirectory();
            
            showToast(`Imported ${parsed.length} students from CSV successfully!`, "success");
            if (isLanding) {
                enterWorkspace('directory');
            }
        };
        reader.readAsText(file);
    }

    function parseCSV(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
        const gradeIdx = headers.findIndex(h => h.includes('grade'));
        const attendanceIdx = headers.findIndex(h => h.includes('attendance'));
        const mathIdx = headers.findIndex(h => h.includes('math'));
        const scienceIdx = headers.findIndex(h => h.includes('science'));
        const englishIdx = headers.findIndex(h => h.includes('english'));
        const historyIdx = headers.findIndex(h => h.includes('history'));
        const artIdx = headers.findIndex(h => h.includes('art') || h.includes('fine arts'));

        const newStudents = [];
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (row.length < headers.length) continue;

            const name = nameIdx !== -1 ? row[nameIdx] : `Student ${i}`;
            const grade = gradeIdx !== -1 ? parseInt(row[gradeIdx]) || 9 : 9;
            const attendance = attendanceIdx !== -1 ? parseFloat(row[attendanceIdx]) || 90 : 90;
            
            const math = mathIdx !== -1 ? parseInt(row[mathIdx]) || 80 : 80;
            const science = scienceIdx !== -1 ? parseInt(row[scienceIdx]) || 80 : 80;
            const english = englishIdx !== -1 ? parseInt(row[englishIdx]) || 80 : 80;
            const history = historyIdx !== -1 ? parseInt(row[historyIdx]) || 80 : 80;
            const art = artIdx !== -1 ? parseInt(row[artIdx]) || 80 : 80;

            const avg = Math.round((math + science + english + history + art) / 5);

            const t1 = Math.max(0, Math.min(100, Math.round(avg + (Math.random() - 0.5) * 8)));
            const t2 = Math.max(0, Math.min(100, Math.round(avg + (Math.random() - 0.5) * 6)));

            newStudents.push({
                id: `STU${String(i).padStart(3, '0')}`,
                name: name,
                grade: grade,
                attendance: attendance,
                scores: {
                    math: Math.max(0, Math.min(100, math)),
                    science: Math.max(0, Math.min(100, science)),
                    english: Math.max(0, Math.min(100, english)),
                    history: Math.max(0, Math.min(100, history)),
                    art: Math.max(0, Math.min(100, art))
                },
                terms: [t1, t2, avg],
                average: avg
            });
        }
        return newStudents;
    }

    function parseCSVRow(text) {
        let p = '', c = [];
        let q = false;
        for (let i = 0; i < text.length; i++) {
            let ch = text[i];
            if (ch === '"') {
                q = !q;
            } else if (ch === ',' && !q) {
                c.push(p.trim().replace(/^["']|["']$/g, ''));
                p = '';
            } else {
                p += ch;
            }
        }
        c.push(p.trim().replace(/^["']|["']$/g, ''));
        return c;
    }

    // --- Startup Executions ---
    updateDateTime();
    initializeData();
    calculateOverviewKPIs();
    updateCharts();
    runCounterAnimation();
    
    // Interval to refresh time indicator
    setInterval(updateDateTime, 60000);
});
