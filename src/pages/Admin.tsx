import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, 
  deleteDoc, doc, where, getDocs 
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from '@/firebase';
import { PostItColor } from '@/components/PostIt';
import { Trash2, Plus, LogOut, MessageSquare, Loader2, Users, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Question {
  id: string;
  text: string;
  color: PostItColor;
  createdAt: any;
  authorUid: string;
}

interface Answer {
  id: string;
  questionId: string;
  text: string;
  createdAt: any;
  sessionId: string;
}

export function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionColor, setNewQuestionColor] = useState<PostItColor>('yellow');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if admin
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.uid)));
          let adminStatus = false;
          if (!userDoc.empty && userDoc.docs[0].data().role === 'admin') {
            adminStatus = true;
          } else if (currentUser.email === 'carlo.brighina@yam112003.com' && currentUser.emailVerified) {
            adminStatus = true;
          }
          setIsAdmin(adminStatus);
        } catch (e) {
          console.error("Error checking admin status", e);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qs: Question[] = [];
      snapshot.forEach((doc) => {
        qs.push({ id: doc.id, ...doc.data() } as Question);
      });
      setQuestions(qs);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const loadAnswers = async (questionId: string) => {
    if (answers[questionId]) {
      setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
      return;
    }

    const q = query(collection(db, 'answers'), where('questionId', '==', questionId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ans: Answer[] = [];
      snapshot.forEach((doc) => {
        ans.push({ id: doc.id, ...doc.data() } as Answer);
      });
      setAnswers(prev => ({ ...prev, [questionId]: ans }));
    });
    setExpandedQuestion(questionId);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !user) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'questions'), {
        text: newQuestionText.trim(),
        color: newQuestionColor,
        createdAt: serverTimestamp(),
        authorUid: user.uid,
      });
      setNewQuestionText('');
      setNewQuestionColor('yellow');
    } catch (error) {
      console.error("Error adding question", error);
      alert("Failed to add question. Check console.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
      } catch (error) {
        console.error("Error deleting question", error);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-pink-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-pink-500" /></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/50">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-4xl font-display text-gray-900 mb-3">Admin Login</h1>
          <p className="text-gray-600 mb-8 text-lg">Sign in to manage your magical Q&A board.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-800 px-6 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
          {user && !isAdmin && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
              Oops! You don't have admin privileges for this board.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-violet-500 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-display text-gray-900">Board Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-slate-600">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Add Question Form */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"></div>
          <h2 className="text-2xl font-display text-gray-900 mb-6 flex items-center gap-3">
            <Plus className="w-6 h-6 text-pink-500" /> Create New Post-it
          </h2>
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div>
              <textarea
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="What's on your mind? Ask a question..."
                className="w-full h-32 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 resize-none font-sans text-lg transition-all"
                required
                maxLength={500}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pick a Color:</span>
                <div className="flex gap-3">
                  {(['yellow', 'pink', 'blue', 'green'] as PostItColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewQuestionColor(c)}
                      className={`w-10 h-10 rounded-full border-4 transition-all shadow-sm ${
                        newQuestionColor === c ? 'scale-110 border-white ring-2 ring-slate-400' : 'border-transparent hover:scale-105'
                      } ${
                        c === 'yellow' ? 'bg-gradient-to-br from-[#fff7b0] to-[#fde047]' :
                        c === 'pink' ? 'bg-gradient-to-br from-[#fce7f3] to-[#f9a8d4]' :
                        c === 'blue' ? 'bg-gradient-to-br from-[#dbeafe] to-[#93c5fd]' : 'bg-gradient-to-br from-[#dcfce7] to-[#86efac]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isAdding || !newQuestionText.trim()}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post to Board'}
              </button>
            </div>
          </form>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display text-gray-900">Active Post-its</h2>
            <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-bold">
              {questions.length} Total
            </span>
          </div>
          
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                <div className="flex items-start gap-5 flex-1">
                  <div className={`w-12 h-12 rounded-2xl shrink-0 shadow-inner flex items-center justify-center ${
                    q.color === 'yellow' ? 'bg-gradient-to-br from-[#fff7b0] to-[#fde047]' :
                    q.color === 'pink' ? 'bg-gradient-to-br from-[#fce7f3] to-[#f9a8d4]' :
                    q.color === 'blue' ? 'bg-gradient-to-br from-[#dbeafe] to-[#93c5fd]' : 'bg-gradient-to-br from-[#dcfce7] to-[#86efac]'
                  }`}>
                    <MessageSquare className="w-5 h-5 text-black/40" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2 leading-snug">{q.text}</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {q.createdAt?.toDate ? format(q.createdAt.toDate(), 'MMM d, yyyy • HH:mm') : 'Just now'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => loadAnswers(q.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                      expandedQuestion === q.id 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    Answers {answers[q.id] ? `(${answers[q.id].length})` : ''}
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-transparent hover:border-red-100"
                    title="Delete post-it"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Answers Section */}
              {expandedQuestion === q.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:p-8">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Anonymous Responses
                  </h4>
                  
                  {!answers[q.id] ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-pink-400" /></div>
                  ) : answers[q.id].length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 border-dashed">
                      <p className="text-slate-500 font-medium">No answers yet. It's quiet here...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {answers[q.id].map((ans) => (
                        <div key={ans.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-gray-800 mb-4 whitespace-pre-wrap text-lg">{ans.text}</p>
                          <div className="flex items-center justify-between text-xs font-medium text-slate-400 pt-4 border-t border-slate-100">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-md">ID: {ans.sessionId.substring(0, 6)}</span>
                            <span>{ans.createdAt?.toDate ? format(ans.createdAt.toDate(), 'MMM d, HH:mm') : 'Just now'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
