import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Shield, CheckCircle, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CreateExam = ({ onBack, onExamCreated }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [proctoringLevel, setProctoringLevel] = useState('standard');
  const [passingScore, setPassingScore] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [questions, setQuestions] = useState([
    {
      question_text: 'What is the primary purpose of an AI proctoring system?',
      question_type: 'mcq',
      options: [
        'To make autonomous pass/fail verdicts',
        'To assist human reviewers with real-time risk signals & anomaly logging',
        'To replace teachers entirely',
        'To restrict candidates from using computers'
      ],
      correct_answer: 'To assist human reviewers with real-time risk signals & anomaly logging',
      points: 1
    },
    {
      question_text: 'In Python, which built-in function returns the length of an object?',
      question_type: 'mcq',
      options: ['size()', 'len()', 'count()', 'length()'],
      correct_answer: 'len()',
      points: 1
    }
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        points: 1
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
    // If the edited option was the correct answer, update correct answer too
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
      setError('Please provide an exam title.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        setError(`Question #${i + 1} cannot have empty text.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const examData = {
        title,
        description,
        duration_minutes: Number(durationMinutes),
        proctoring_level: proctoringLevel,
        passing_score: Number(passingScore),
        questions
      };
      await api.createExam(examData, token);
      onExamCreated();
    } catch (err) {
      setError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Assessment</h1>
          <p className="text-xs text-slate-400">Configure exam parameters and AI vision proctoring rules</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>1. Exam Details</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Exam Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python & Deep Learning Certification"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description / Instructions
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for the candidate regarding test duration and proctoring..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Proctoring Level */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>2. Proctoring Level</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'basic',
                label: 'Basic Proctoring',
                desc: 'Face presence check, multiple faces detection, and camera status monitoring.',
                badge: 'Quizzes'
              },
              {
                id: 'standard',
                label: 'Standard (Recommended)',
                desc: 'Basic + Gaze tracking, head pose estimation, phone & prohibited device alerts.',
                badge: 'Exams & Certs'
              },
              {
                id: 'strict',
                label: 'Strict Security',
                desc: 'All features + Browser fullscreen enforcement, audio activity, and evidence snapshots.',
                badge: 'High Stakes'
              }
            ].map((lvl) => (
              <label
                key={lvl.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  proctoringLevel === lvl.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{lvl.label}</span>
                    <input
                      type="radio"
                      name="proctoringLevel"
                      value={lvl.id}
                      checked={proctoringLevel === lvl.id}
                      onChange={() => setProctoringLevel(lvl.id)}
                      className="accent-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{lvl.desc}</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 w-fit">
                  {lvl.badge}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 3: Questions */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              3. Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    Question #{qIdx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={q.question_text}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    placeholder="Enter question text here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Options (Select radio for correct answer):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-center space-x-2 p-2 rounded-xl border ${
                          q.correct_answer === opt
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_q_${qIdx}`}
                          checked={q.correct_answer === opt}
                          onChange={() => setCorrectOption(qIdx, opt)}
                          className="accent-emerald-500"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Exam...' : 'Publish Exam'}
          </button>
        </div>

      </form>
    </div>
  );
};
