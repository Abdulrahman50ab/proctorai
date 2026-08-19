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
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [reportSessionId, setReportSessionId] = useState(null);

  // Check URL parameters on mount (e.g. ?exam=xyz or ?session=abc)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const examParam = params.get('exam');
    const sessionParam = params.get('session');

    if (sessionParam) {
      setReportSessionId(sessionParam);
      setCurrentTab('report');
    } else if (examParam) {
      setSelectedExamId(examParam);
      setCurrentTab('candidate-system-check');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If candidate is in active exam, render full-screen exam room without standard navbar
  if (currentTab === 'candidate-exam-room' && activeSession) {
    return (
      <CandidateExamRoom
        session={activeSession}
        onExamCompleted={(sessionId) => {
          setReportSessionId(sessionId);
          setCurrentTab('report');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1">
        {/* If user is not logged in and not in a candidate flow, show Auth */}
        {!user && currentTab !== 'candidate-system-check' && currentTab !== 'report' ? (
          authMode === 'login' ? (
            <Login
              onSwitchToRegister={() => setAuthMode('register')}
              onCandidateAccess={() => {
                // Default to first exam or prompt code
                setCurrentTab('candidate-system-check');
              }}
            />
          ) : (
            <Register onSwitchToLogin={() => setAuthMode('login')} />
          )
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <ExaminerDashboard
                onCreateExamClick={() => setCurrentTab('create-exam')}
                onStartCandidateExam={(examId) => {
                  setSelectedExamId(examId);
                  setCurrentTab('candidate-system-check');
                }}
                onViewReport={(sessionId) => {
                  setReportSessionId(sessionId);
                  setCurrentTab('report');
                }}
              />
            )}

            {currentTab === 'create-exam' && (
              <CreateExam
                onBack={() => setCurrentTab('dashboard')}
                onExamCreated={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'candidate-system-check' && (
              <CandidateSystemCheck
                examId={selectedExamId}
                onSystemCheckPassed={(session) => {
                  setActiveSession(session);
                  setCurrentTab('candidate-exam-room');
                }}
                onBackToLogin={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'report' && (
              <ReportView
                sessionId={reportSessionId || activeSession?.id}
                onBackToDashboard={() => setCurrentTab('dashboard')}
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
