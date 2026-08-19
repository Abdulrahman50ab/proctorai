import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Shield, CheckCircle2, HelpCircle, 
  Sparkles, BookOpen, AlertCircle, Save, Layers, Check 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CreateExam = ({ onBack, onExamCreated }) => {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [proctoringLevel, setProctoringLevel] = useState('standard');
  const [passingScore, setPassingScore] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [questions, setQuestions] = useState([
    {
      question_text: 'What is the primary purpose of real-time AI vision proctoring?',
      question_type: 'mcq',
      options: [
        'To make autonomous pass/fail decisions',
        'To assist human reviewers with real-time risk telemetry & anomaly logging',
        'To lock the computer screen completely',
        'To format candidate response payloads'
      ],
      correct_answer: 'To assist human reviewers with real-time risk telemetry & anomaly logging',
      points: 1,
      explanation: 'AI proctoring acts as an assistive signal layer; human reviewers make final determinations.'
    },
    {
      question_text: 'Which data structure in Python is immutable?',
      question_type: 'mcq',
      options: ['List', 'Dictionary', 'Tuple', 'Set'],
      correct_answer: 'Tuple',
      points: 1,
      explanation: 'Tuples cannot be modified after creation in Python.'
    }
  ]);

  const loadTemplate = (type) => {
    if (type === 'ai') {
      setTitle('Machine Learning & Computer Vision Assessment');
      setDescription('Comprehensive evaluation testing neural networks, OpenCV image processing, and AI ethics.');
      setDurationMinutes(30);
      setProctoringLevel('strict');
      setQuestions([
        {
          question_text: 'Which OpenCV function is used to convert an image between color spaces?',
          question_type: 'mcq',
          options: ['cv2.transformColor()', 'cv2.cvtColor()', 'cv2.convertImage()', 'cv2.imcolor()'],
          correct_answer: 'cv2.cvtColor()',
          points: 1
        },
        {
          question_text: 'In MediaPipe Face Mesh, approximately how many 3D facial landmarks are tracked?',
          question_type: 'mcq',
          options: ['68 landmarks', '468+ landmarks', '1024 landmarks', '32 landmarks'],
          correct_answer: '468+ landmarks',
          points: 1
        },
        {
          question_text: 'What does YOLO stand for in deep learning object detection?',
          question_type: 'mcq',
          options: ['You Only Look Once', 'Yield Optimized Linear Output', 'You Observe Layers Once', 'Yearly Open Learning Optimizer'],
          correct_answer: 'You Only Look Once',
          points: 1
        }
      ]);
    } else if (type === 'web') {
      setTitle('Full-Stack Web Engineering Certification');
      setDescription('Evaluates React, FastAPI, REST APIs, and asynchronous programming.');
      setDurationMinutes(20);
      setProctoringLevel('standard');
      setQuestions([
        {
          question_text: 'In React, what hook is used to manage side effects such as data fetching or subscriptions?',
          question_type: 'mcq',
          options: ['useState', 'useMemo', 'useEffect', 'useCallback'],
          correct_answer: 'useEffect',
          points: 1
        },
        {
          question_text: 'In FastAPI, which standard is used for automatic interactive API documentation?',
          question_type: 'mcq',
          options: ['GraphQL', 'OpenAPI / Swagger', 'SOAP', 'gRPC'],
          correct_answer: 'OpenAPI / Swagger',
          points: 1
        }
      ]);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        points: 1,
        explanation: ''
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].question_text = text;
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, text) => {
    const updated = [...questions];
    const oldOption = updated[qIdx].options[optIdx];
    updated[qIdx].options[optIdx] = text;
    // If this option was selected as the correct answer, update the correct_answer string too
    if (updated[qIdx].correct_answer === oldOption) {
      updated[qIdx].correct_answer = text;
    }
    setQuestions(updated);
  };

  const setCorrectOption = (qIdx, optionText) => {
    const updated = [...questions];
    updated[qIdx].correct_answer = optionText;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question #${i + 1} cannot have empty text.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        setError(`Question #${i + 1} must have at least 2 options.`);
        return;
      }
      if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
        // Default to first option if not explicitly selected
        q.correct_answer = q.options[0];
      }
    }

    setLoading(true);
    setError(null);

    try {
      const examData = {
        title: title.trim(),
        description: description.trim() || 'Standard proctored assessment.',
        duration_minutes: Number(durationMinutes) || 20,
        proctoring_level: proctoringLevel,
        passing_score: Number(passingScore) || 60,
        questions: questions.map(q => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type || 'mcq',
          options: q.options.map(opt => opt.trim()),
          correct_answer: q.correct_answer.trim(),
          points: Number(q.points) || 1,
          explanation: q.explanation ? q.explanation.trim() : null
        }))
      };

      const result = await api.createExam(examData, token);
      setSuccess(true);
      setTimeout(() => {
        if (onExamCreated) onExamCreated(result);
      }, 1000);
    } catch (err) {
      console.error('Create exam error:', err);
      setError(err.message || 'Failed to create assessment. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create New Assessment</h1>
            <p className="text-xs text-slate-400">Configure questions, duration, and AI proctoring security rules</p>
          </div>
        </div>

        {/* Quick Template Fill Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Templates:</span>
          <button
            type="button"
            onClick={() => loadTemplate('ai')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI / CV Exam</span>
          </button>
          <button
            type="button"
            onClick={() => loadTemplate('web')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Web Dev Exam</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Assessment created successfully! Redirecting to dashboard...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Assessment Meta */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">1</span>
            <span>Assessment Details</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assessment Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python & Deep Learning Certification"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description / Candidate Instructions
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Candidate instructions regarding timing, webcam positioning, and test conduct..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Proctoring Security Rules */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">2</span>
            <span>AI Proctoring Security Level</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'basic',
                label: 'Basic Proctoring',
                desc: 'Face presence check, multiple faces count, and camera obstruction monitoring.',
                badge: 'Quizzes'
              },
              {
                id: 'standard',
                label: 'Standard (Recommended)',
                desc: 'Basic + Gaze tracking, head pose estimation, phone & physical device detection.',
                badge: 'Exams & Certs'
              },
              {
                id: 'strict',
                label: 'Strict Security',
                desc: 'All features + Fullscreen focus enforcement, audio sensitivity, and evidence snapshots.',
                badge: 'High Stakes'
              }
            ].map((lvl) => (
              <label
                key={lvl.id}
                onClick={() => setProctoringLevel(lvl.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  proctoringLevel === lvl.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{lvl.label}</span>
                    <input
                      type="radio"
                      name="proctoringLevel"
                      value={lvl.id}
                      checked={proctoringLevel === lvl.id}
                      onChange={() => setProctoringLevel(lvl.id)}
                      className="accent-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{lvl.desc}</p>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">{lvl.badge}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 3: Questions Builder */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">3</span>
              <span>Questions ({questions.length})</span>
            </h2>

            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    Question #{qIdx + 1}
                  </span>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <div>
                  <input
                    type="text"
                    required
                    value={q.question_text}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    placeholder={`Enter Question #${qIdx + 1} text...`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Options &amp; Correct Answer (Click radio to mark correct):
                  </span>
                  
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correct_answer === opt;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={isCorrect}
                          onChange={() => setCorrectOption(qIdx, opt)}
                          className="accent-emerald-500 ml-1 cursor-pointer"
                        />
                        <span className="font-mono text-xs font-bold text-slate-400 w-4">
                          {letter}.
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${letter}`}
                          className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating Assessment...' : 'Save & Publish Assessment'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
