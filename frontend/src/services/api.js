const API_BASE = '/api';

const getAuthHeaders = (token) => {
  const authToken = token || localStorage.getItem('proctorai_token');
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Exams
  async getExams(token) {
    const res = await fetch(`${API_BASE}/exams`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) return [];
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
      headers: getAuthHeaders(token),
      body: JSON.stringify(examData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      let msg = err.detail;
      if (Array.isArray(err.detail)) {
        msg = err.detail.map(d => `${d.loc ? d.loc.join(' -> ') : ''}: ${d.msg}`).join(', ');
      }
      throw new Error(msg || 'Failed to create exam');
    }
    return res.json();
  },

  async generateQuestionsFromTopic(topic, count = 5, difficulty = 'medium', token) {
    const res = await fetch(`${API_BASE}/exams/generate-from-topic`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ topic, count, difficulty }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Groq could not generate questions from this topic');
    }
    return res.json();
  },

  async generateQuestionsFromPdf(file, count = 8, difficulty = 'medium', token) {
    const form = new FormData();
    form.append('file', file);
    form.append('count', String(count));
    form.append('difficulty', difficulty);
    const authToken = token || localStorage.getItem('proctorai_token');
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/exams/generate-from-pdf`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Groq could not generate questions from this PDF');
    }
    return res.json();
  },

  async deleteExam(examId, token) {
    const res = await fetch(`${API_BASE}/exams/${examId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete exam');
    return true;
  },

  // Sessions
  async createSession({ exam_id, candidate_name, candidate_email }) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_id,
        candidate_name,
        candidate_email,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create candidate session');
    }
    return res.json();
  },

  async getSession(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  },

  async startSession(sessionId, referencePhotoBase64 = null) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference_photo_base64: referencePhotoBase64,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start session');
    }
    return res.json();
  },

  async submitSession(sessionId, answers) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit exam');
    }
    return res.json();
  },

  async processFrame(sessionId, frameBase64) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/process-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame_base64: frameBase64 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Frame processing request error:', err);
      throw new Error(err.detail || 'Frame processing failed');
    }
    return res.json();
  },

  async logEvent(sessionId, eventType, confidence = 1.0, details = null) {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          confidence,
          details,
        }),
      });
      if (!res.ok) {
        console.warn('Could not log event:', await res.json().catch(() => ({})));
        return null;
      }
      return res.json();
    } catch (e) {
      console.warn('Could not log event:', e);
      return null;
    }
  },

  // Reports
  async getReports(token) {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getReport(reportId, token) {
    const res = await fetch(`${API_BASE}/reports/${reportId}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Report not found');
    return res.json();
  },

  async getSessionReport(sessionId) {
    const res = await fetch(`${API_BASE}/reports/session/${sessionId}`);
    if (!res.ok) {
      const fallback = await fetch(`${API_BASE}/reports/${sessionId}`);
      if (!fallback.ok) throw new Error('Report not found');
      return fallback.json();
    }
    return res.json();
  },
};
