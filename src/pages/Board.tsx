import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { PostIt, PostItColor } from '@/components/PostIt';
import { Modal } from '@/components/ui/Modal';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  color: PostItColor;
  createdAt: any;
  authorUid: string;
}

export function Board() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate a random session ID for anonymous users
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('anon_session_id');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anon_session_id', newId);
    return newId;
  });

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qs: Question[] = [];
      snapshot.forEach((doc) => {
        qs.push({ id: doc.id, ...doc.data() } as Question);
      });
      setQuestions(qs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePostItClick = (q: Question) => {
    setSelectedQuestion(q);
    setAnswer('');
    setSubmitted(false);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !selectedQuestion) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'answers'), {
        questionId: selectedQuestion.id,
        text: answer.trim(),
        createdAt: serverTimestamp(),
        sessionId: sessionId,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSelectedQuestion(null);
      }, 2000);
    } catch (err) {
      console.error("Error submitting answer:", err);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl shadow-xl flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <span className="font-display text-xl text-gray-800">Loading magic...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl">
          <p className="text-red-500 font-medium text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg p-8 sm:p-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/30 backdrop-blur-md px-8 py-4 rounded-full shadow-sm border border-white/40">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 font-display tracking-tight drop-shadow-sm">
              Q&A Board
            </h1>
            <Sparkles className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-gray-800 text-xl font-medium drop-shadow-sm">Click on a post-it to leave your anonymous answer.</p>
        </header>

        {questions.length === 0 ? (
          <div className="text-center mt-20">
            <div className="inline-block bg-white/40 backdrop-blur-md px-8 py-6 rounded-3xl shadow-lg border border-white/50">
              <p className="text-2xl font-display text-gray-800">No questions yet.</p>
              <p className="text-gray-600 mt-2">Check back later for some inspiration!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10 sm:gap-16 pt-4">
            {questions.map((q, i) => {
              // Deterministic pseudo-random rotation between -6 and 6 degrees
              const rotation = (parseInt(q.id.substring(0, 4), 16) % 13) - 6;
              
              return (
                <PostIt
                  key={q.id}
                  text={q.text}
                  color={q.color}
                  rotation={rotation}
                  onClick={() => handlePostItClick(q)}
                />
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedQuestion}
        onClose={() => !isSubmitting && setSelectedQuestion(null)}
        className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl"
      >
        {selectedQuestion && (
          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 font-display">
                {selectedQuestion.text}
              </h2>
              <div className="inline-block bg-pink-100 text-pink-800 px-4 py-1.5 rounded-full text-sm font-medium">
                Your answer is completely anonymous 🤫
              </div>
            </div>

            {submitted ? (
              <div className="bg-green-100/80 backdrop-blur-sm text-green-800 p-6 rounded-2xl text-center font-medium text-lg shadow-inner">
                ✨ Thank you! Your answer has been submitted.
              </div>
            ) : (
              <form onSubmit={handleSubmitAnswer} className="space-y-6">
                <div className="relative">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-40 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 resize-none font-sans text-lg transition-all shadow-inner"
                    required
                    maxLength={2000}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
                    {answer.length}/2000
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !answer.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-pink-500/30"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Send Answer <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
