import React from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';

const AttendancePage = () => {
    return (
        <DashboardShell title="Attendance">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: '#fff', letterSpacing: '0.05em', marginBottom: 5 }}>
                        Attendance Records
                    </h1>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#888' }}>
                        // Tracking system active. View your historical presence and gym activity.
                    </p>
                </div>

                <AttendanceCalendar />
            </div>
        </DashboardShell>
    );
};

export default AttendancePage;
