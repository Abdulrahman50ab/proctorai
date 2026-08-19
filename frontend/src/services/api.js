const API_BASE = '/api';

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(name, email, password, role = 'examiner') {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Exams
  async getExams(token) {
    const res = await fetch(`${API_BASE}/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch exams');
    return res.json();
  },

  async getExam(examId) {
    const res = await fetch(`${API_BASE}/exams/${examId}`);
    if (!res.ok) throw new Error('Exam not found');
    return res.json();
  },

  async createExam(examData, token) {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(examData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create exam');
    }
    return res.json();
  },

  async deleteExam(examId, token) {
    const res = await fetch(`${API_BASE}/exams/${examId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete exam');
    return true;
  },

  // Sessions
  async createSession(examId, candidateName, candidateEmail) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_id: examId,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create candidate session');
    }
    return res.json();
  },

  async getSession(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  },

  async startSession(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/start`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async submitSession(sessionId, answers) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error('Failed to submit exam');
    return res.json();
  },

  async processFrame(sessionId, frameBase64) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/process-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame_base64: frameBase64 }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async logEvent(sessionId, eventType, evidenceBase64 = null) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        event_type: eventType,
        evidence_base64: evidenceBase64,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Reports
  async getReport(sessionId) {
    const res = await fetch(`${API_BASE}/reports/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  },

  async getExamReports(examId, token) {
    const res = await fetch(`${API_BASE}/reports/exam/${examId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch exam reports');
    return res.json();
  }
};
