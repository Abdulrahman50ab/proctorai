import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ExaminerDashboard } from './pages/ExaminerDashboard';
import { CreateExam } from './pages/CreateExam';
import { CandidateSystemCheck } from './pages/CandidateSystemCheck';
import { CandidateExamRoom } from './pages/CandidateExamRoom';
import { ReportView } from './pages/ReportView';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('examiner_dashboard');
  const [selectedExam, setSelectedExam] = useState(null);
  const [candidateInfo, setCandidateInfo] = useState({ name: 'Candidate', email: 'candidate@test.com' });
  const [activeSession, setActiveSession] = useState(null);
  const [activeReportId, setActiveReportId] = useState(null);
  const [activeReportSessionId, setActiveReportSessionId] = useState(null);

  // Handle navigation across pages
  const handleNavigate = (tabName, params = {}) => {
    if (params.examId || params.exam) {
      setSelectedExam(params.exam || { id: params.examId });
    }
    if (params.reportId) {
      setActiveReportId(params.reportId);
    }
    if (params.sessionId) {
      setActiveReportSessionId(params.sessionId);
    }
    setCurrentTab(tabName);
  };

  const handleLaunchCandidate = (exam) => {
    setSelectedExam(exam);
    const candidateName = user ? user.name : 'Candidate';
    const candidateEmail = user ? user.email : `candidate_${Date.now()}@test.com`;
    setCandidateInfo({ name: candidateName, email: candidateEmail });
    setCurrentTab('candidate_system_check');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Active exam room full-screen mode
  if (currentTab === 'candidate_exam_room' && activeSession) {
    return (
      <CandidateExamRoom
        session={activeSession}
        onExamCompleted={(sessionId) => {
          setActiveReportId(null);
          setActiveReportSessionId(sessionId);
          setCurrentTab('report_view');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentTab={currentTab} onTabChange={handleNavigate} />

      <main className="flex-1">
        {/* If user is not logged in and not in a candidate or report flow, show Auth */}
        {!user && currentTab !== 'candidate_system_check' && currentTab !== 'report_view' ? (
          currentTab === 'register' ? (
            <Register onSwitchToLogin={() => setCurrentTab('login')} />
          ) : (
            <Login
              onSwitchToRegister={() => setCurrentTab('register')}
              onCandidateAccess={(code) => {
                // Direct candidate access
                setCurrentTab('examiner_dashboard');
              }}
            />
          )
        ) : (
          <>
            {(currentTab === 'examiner_dashboard' || currentTab === 'dashboard') && (
              <ExaminerDashboard
                onNavigate={handleNavigate}
                onLaunchCandidate={handleLaunchCandidate}
              />
            )}

            {(currentTab === 'create_exam' || currentTab === 'create-exam') && (
              <CreateExam
                onBack={() => setCurrentTab('examiner_dashboard')}
                onExamCreated={() => setCurrentTab('examiner_dashboard')}
              />
            )}

            {currentTab === 'candidate_system_check' && selectedExam && (
              <CandidateSystemCheck
                exam={selectedExam}
                candidateInfo={candidateInfo}
                onSystemCheckPassed={(session) => {
                  setActiveSession(session);
                  setCurrentTab('candidate_exam_room');
                }}
              />
            )}

            {(currentTab === 'report_view' || currentTab === 'reports') && (
              <ReportView
                reportId={activeReportId}
                sessionId={activeReportSessionId}
                onBack={() => setCurrentTab('examiner_dashboard')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
