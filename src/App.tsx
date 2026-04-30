/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Menu, 
  X, 
  LayoutDashboard, 
  Zap, 
  BookOpen, 
  Database, 
  FileText,
  Activity,
  User,
  Settings,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  ExternalLink,
  HelpCircle,
  TrendingUp,
  Map as MapIcon,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Threat, ThreatLevel, UserStats } from './types';
import { analyzePotentialThreat, AnalysisResult } from './services/gemini';
import { INITIAL_QUIZZES } from './constants';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';

// --- View Components ---

const StatusBadge = ({ level }: { level: ThreatLevel }) => {
  const colors = {
    [ThreatLevel.LOW]: 'bg-emerald-500 text-black',
    [ThreatLevel.MEDIUM]: 'bg-amber-500 text-black',
    [ThreatLevel.HIGH]: 'bg-rose-500 text-white',
    [ThreatLevel.CRITICAL]: 'bg-rose-600 text-white',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${colors[level]}`}>
      {level}
    </span>
  );
};

const Dashboard = ({ threats, stats }: { threats: Threat[], stats: UserStats }) => {
  const activeThreatsCount = threats.filter(t => t.status === 'pending').length;
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Left Column: Status & Shield */}
      <div className="lg:w-1/2 flex flex-col gap-6 h-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center relative flex-1"
        >
          {/* Abstract Shield Visual */}
          <div className="w-64 h-64 border-4 border-cyan-500/20 rounded-full flex items-center justify-center relative shadow-[0_0_100px_rgba(6,182,212,0.1)]">
            <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className={`w-48 h-48 rounded-full flex flex-col items-center justify-center border transition-colors duration-500 ${activeThreatsCount > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${activeThreatsCount > 0 ? 'text-rose-400' : 'text-cyan-400'}`}>Device Status</span>
              <span className="text-5xl font-black text-white leading-none">{activeThreatsCount > 0 ? 'RISK' : 'SECURE'}</span>
              <span className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest">Active Protection System</span>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-4 w-full">
            <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Scans Run</p>
              <p className="text-2xl font-bold text-white leading-tight">{stats.scansPerformed}</p>
            </div>
            <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Global Uptime</p>
              <p className="text-2xl font-bold text-white leading-tight">99.9%</p>
            </div>
          </div>
        </motion.div>

        {/* Metric Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Security Score', value: stats.securityScore + '%', color: 'text-cyan-400' },
            { label: 'Threats Blocked', value: stats.threatsBlocked, color: 'text-emerald-400' },
            { label: 'Network Tier', value: 'A+', color: 'text-white' },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"
            >
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Column: Live Feed */}
      <div className="lg:w-1/2 flex flex-col gap-6 h-full">
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-white font-bold text-sm tracking-[0.1em] uppercase">Security Activity Feed</h4>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
               <span className="text-[10px] text-slate-500 font-bold uppercase">Live</span>
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {threats.length > 0 ? (
              threats.map((threat, i) => (
                <motion.div 
                  key={threat.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-5 p-4 bg-slate-800/20 rounded-2xl border border-white/5 hover:bg-slate-800/40 transition-colors group cursor-default"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${threat.status === 'blocked' ? 'bg-rose-500' : 'bg-cyan-500'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{threat.content}</p>
                    <div className="flex items-center gap-3 mt-1">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{new Date(threat.timestamp).toLocaleTimeString()}</p>
                       <div className="w-1 h-1 bg-slate-700 rounded-full" />
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{threat.type}</p>
                    </div>
                  </div>
                  <StatusBadge level={threat.level} />
                </motion.div>
              ))
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center opacity-30 h-full">
                    <ShieldCheck className="w-12 h-12 mb-4" />
                    <p className="text-xs uppercase tracking-[0.2em]">No suspicious activity detected</p>
                </div>
            )}
          </div>

          <div className="mt-8">
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-3xl p-6">
              <p className="text-[10px] font-bold text-cyan-400 mb-2 tracking-[0.2em] uppercase">Defence Tip</p>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Always check the sender profile of SMS claiming to be from government entities. Real agencies rarely use WhatsApp for subsidies."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThreatScanner = ({ onScanResult }: { onScanResult: (threat: Omit<Threat, 'id'>) => void }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const runScan = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    setHistory(prev => [`> INITIATING DEEP SCAN...`, ...prev]);
    
    try {
      const result = await analyzePotentialThreat(inputText);
      setAnalysis(result);
      
      const newThreat: Omit<Threat, 'id'> = {
        type: 'SMS',
        source: 'MANUAL_SCAN',
        content: inputText,
        timestamp: new Date().toISOString(),
        level: result.level,
        status: result.isThreat ? 'blocked' : 'dismissed',
        analysis: result.explanation
      };
      
      onScanResult(newThreat);
      setHistory(prev => [`> SCAN COMPLETE: ${result.category} (${result.level})`, ...prev]);
    } catch (e) {
      setHistory(prev => [`> ERROR: ENGINE TIMEOUT`, ...prev]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-sm font-bold tracking-[0.2em] mb-6 flex items-center gap-3 text-white uppercase">
          <Terminal className="w-5 h-5 text-cyan-400" /> Sentinel Threat Analysis
        </h2>
        
        <div className="relative group">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isScanning}
            className="w-full h-40 bg-[#05070A] border border-slate-800 rounded-2xl p-6 text-sm font-medium text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-all placeholder-slate-700 resize-none"
            placeholder="Paste suspicious content, URLs, or message bodies for deep metadata checking..."
          />
          {isScanning && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl border border-cyan-500/30">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-cyan-500/20 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Analyzing metadata...</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">AI Core v4.0.21 Ready</p>
            <button 
                onClick={runScan}
                disabled={isScanning || !inputText.trim()}
                className="px-8 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest text-xs"
            >
                Start Analysis
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em] mb-6 uppercase">Scan Results</h3>
          {analysis ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-800/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                 <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Engine Verdict</p>
                    <p className="text-lg font-bold text-white tracking-tight">{analysis.category}</p>
                 </div>
                 <StatusBadge level={analysis.level} />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-300 leading-relaxed italic border-l-4 border-cyan-500/30 pl-5">
                  "{analysis.explanation}"
                </p>
              </div>
              <div className="pt-4 space-y-4">
                <p className="text-[10px] text-cyan-400 font-black tracking-widest uppercase">Defence Protocols:</p>
                <div className="grid grid-cols-1 gap-2">
                  {analysis.defenceTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10 text-xs text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-20">
               <ShieldAlert className="w-16 h-16 mb-4" />
               <p className="text-xs font-bold tracking-[0.2em] uppercase">No active analysis</p>
            </div>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-slate-500 tracking-[0.2em] mb-6 uppercase">Sentinel System Log</h3>
          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[10px] pr-2 custom-scrollbar">
            {history.map((log, i) => (
              <div key={i} className={`flex items-start gap-3 p-2 rounded ${log.includes('ERROR') ? 'bg-rose-500/10 text-rose-400' : log.includes('COMPLETE') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900/50 text-slate-500'}`}>
                <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                <span className="font-bold">{log}</span>
              </div>
            ))}
            {history.length === 0 && (
                <div className="h-full flex items-center justify-center opacity-10">
                    <p className="text-xs tracking-widest uppercase">System Logs Empty</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizHub = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (idx: number) => {
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === INITIAL_QUIZZES[currentIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setCurrentIdx(prev => (prev + 1) % INITIAL_QUIZZES.length);
  };

  const current = INITIAL_QUIZZES[currentIdx];

  return (
    <div className="space-y-8 h-full flex flex-col items-center">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl">
           <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <BookOpen className="w-8 h-8 text-black" />
           </div>
           <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">The Guardian's Trial</h2>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Sharpen your defensive instincts through real-world threat simulations.</p>
           </div>
           <div className="flex justify-center gap-2">
                {INITIAL_QUIZZES.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-cyan-500' : 'w-2 bg-slate-800'}`} />
                ))}
           </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
          <div className="space-y-3">
            <span className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.4em] block">Simulation Scenario {currentIdx + 1}</span>
            <h3 className="text-lg font-bold text-white leading-relaxed">{current.question}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {current.options.map((option, i) => (
              <button
                key={i}
                onClick={() => !showExplanation && handleAnswer(i)}
                disabled={showExplanation}
                className={`p-6 text-left text-sm font-bold border-2 transition-all duration-300 rounded-2xl flex items-center justify-between group ${
                  showExplanation 
                    ? i === current.correctAnswer 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : i === selectedOption
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                        : 'border-slate-800 text-slate-600'
                    : 'border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-5">
                  <span className={`w-8 h-8 flex items-center justify-center border-2 rounded-xl text-xs transition-colors ${showExplanation && i === current.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-current'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </div>
                {showExplanation && i === current.correctAnswer && <ShieldCheck className="w-5 h-5" />}
                {showExplanation && i === selectedOption && i !== current.correctAnswer && <X className="w-5 h-5 text-rose-500" />}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showExplanation && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t border-slate-800"
              >
                <div className="bg-[#05070A] p-6 rounded-2xl border border-cyan-500/10 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 rounded-full" />
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2">Researcher Insights:</p>
                  <p className="text-sm text-slate-300 leading-relaxed italic pr-4">"{current.explanation}"</p>
                </div>
                <button 
                  onClick={nextQuestion}
                  className="mt-8 w-full py-4 bg-cyan-500 text-black font-black text-xs uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                >
                  Confirm Insight & Proceed
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const GlobalMap = () => {
    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-white tracking-tighter flex items-center gap-3 uppercase italic">
                       <Globe className="w-6 h-6 text-cyan-500 animate-pulse" /> Sentinel Global Nexus
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-9">Real-time threat telemetry feed</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"/>
                        <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Global Attack Trace</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] flex-1 flex items-center justify-center relative overflow-hidden bg-black shadow-2xl">
                 <div className="absolute inset-0 opacity-10 cyber-grid" />
                 <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
                 
                 {/* Simulated Map Markers */}
                 <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-75 shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
                 <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-rose-500 rounded-full animate-pulse delay-150 shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                 
                 <div className="text-center z-10 max-w-xl space-y-6 p-8">
                    <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20 mb-4 group hover:border-cyan-500/50 transition-colors">
                        <MapIcon className="w-10 h-10 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm font-black text-white tracking-[0.3em] uppercase">Distributed Defence Mesh</p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium capitalize">
                        Aggregating anonymized signatures from 12,402 Mobile Sentinels worldwide. This data is used by Cybersecurity Researchers to track new attack vectors in real-time.
                    </p>
                    <div className="grid grid-cols-2 gap-6 pt-8">
                        <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Daily Vectory (24H)</p>
                            <p className="text-3xl font-black text-cyan-400">142</p>
                        </div>
                        <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Live Nodes</p>
                            <p className="text-3xl font-black text-emerald-400">9,122</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

const HeroMissions = ({ user, onScanResult }: { user: FirebaseUser | null, onScanResult: (threat: Omit<Threat, 'id'>) => void }) => {
  const [step, setStep] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);

  const scenario = {
    title: "The 'Government Subsidy' Forward",
    description: "A user receives a WhatsApp forward containing a link to a 'Government Subsidy'.",
    content: "Hey, did you see this? The government is giving out $5,000 subsidies for the new year! Check your eligibility here: http://gov-subsidies-portal.web/apply",
    action: "Run sentinel analyzer on this link."
  };

  const startAnalysis = async () => {
    if (!user) {
      alert("Please login first to run analysis.");
      return;
    }
    setStep(1);
    // Simulate thinking/scanning
    setTimeout(async () => {
        const result = await analyzePotentialThreat(scenario.content);
        setAlertVisible(true);
        onScanResult({
            type: 'URL',
            source: 'WHATSAPP_FORWARD',
            content: scenario.content,
            timestamp: new Date().toISOString(),
            level: result.level,
            status: 'blocked',
            analysis: result.explanation
        });
        setStep(2);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 h-full flex flex-col">
      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 space-y-4">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">Hero Scenario: Sentinel in Action</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">Experience how CyberGuard proactively blocks sophisticated social engineering attacks before they reach the user.</p>
      </div>

      <div className="relative flex-1">
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 h-full flex flex-col justify-center gap-12 overflow-hidden relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full cyber-grid" />
            </div>

            <div className="flex items-start gap-6 relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 text-cyan-400 shadow-inner">
                  <User className="w-6 h-6" />
               </div>
               <div className="space-y-2 flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Intercepted Incoming Data</p>
                  <div className="bg-slate-950 p-6 border border-slate-800 rounded-3xl text-sm text-slate-300 italic shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-3">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    </div>
                    "{scenario.content}"
                  </div>
               </div>
            </div>

            <div className="flex justify-center relative z-10">
                {step === 0 && (
                    <button 
                        onClick={startAnalysis}
                        className="px-10 py-4 bg-cyan-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all flex items-center gap-3 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                    >
                        <Zap className="w-5 h-5" /> Initialize Sentinel Response
                    </button>
                )}
                {step === 1 && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-1.5 bg-slate-800 overflow-hidden rounded-full relative">
                            <motion.div 
                                className="absolute inset-0 bg-cyan-500"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] animate-pulse uppercase">Correlating Vectors...</span>
                    </div>
                )}
                {step === 2 && !alertVisible && (
                     <div className="flex flex-col items-center gap-4 text-rose-400">
                        <ShieldAlert className="w-12 h-12 animate-bounce" />
                        <span className="text-xs font-black tracking-widest uppercase">Threat Vector Identified</span>
                     </div>
                )}
            </div>
        </div>

        <AnimatePresence>
            {alertVisible && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center p-8 z-20 backdrop-blur-md bg-slate-950/80 rounded-[2.5rem]"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-rose-500/10 border border-rose-500/40 rounded-[2.5rem] p-10 flex gap-8 max-w-2xl shadow-[0_0_100px_rgba(244,63,94,0.15)]"
                    >
                        <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/40">
                             <ShieldAlert className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-rose-400 font-black text-2xl tracking-tighter uppercase italic">Scam Detected</h3>
                                <span className="text-[10px] bg-rose-500 text-white px-3 py-1 rounded-full uppercase font-black tracking-widest">High Priority</span>
                            </div>
                            <p className="text-slate-200 text-sm leading-relaxed font-medium">Intercepted WhatsApp message with suspicious metadata referencing <span className="text-rose-300 font-mono font-bold bg-rose-500/20 px-1 rounded">"Government Subsidy"</span>. Link identified as phishing via AI heuristics.</p>
                            <div className="flex gap-4 mt-6">
                                <button 
                                    onClick={() => setAlertVisible(false)}
                                    className="px-6 py-3 bg-rose-500 text-white text-xs font-black rounded-xl hover:bg-rose-600 transition-all uppercase tracking-widest"
                                >
                                    Neutralize Threat
                                </button>
                                <button className="px-6 py-3 bg-slate-800 text-slate-300 text-xs font-black rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest border border-white/5">
                                    Analyze Log
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
            { label: 'INGESTION', desc: 'Securely monitor communication streams for anomalies.', icon: Database },
            { label: 'TRANSFORMATION', desc: 'ML-powered social engineering pattern matching.', icon: Zap },
            { label: 'CONSUMPTION', desc: 'Clear alerts and instantly actionable defence tips.', icon: HelpCircle },
        ].map((item, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group">
                <item.icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-white uppercase tracking-widest">{item.label}</p>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">{item.desc}</p>
            </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'scan' | 'alerts' | 'quiz' | 'map' | 'scenarios'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [stats, setStats] = useState<UserStats>({
    scansPerformed: 0,
    threatsDetected: 0,
    threatsBlocked: 0,
    securityScore: 100,
  });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setThreats([]);
      setStats({
        scansPerformed: 0,
        threatsDetected: 0,
        threatsBlocked: 0,
        securityScore: 100,
      });
      return;
    }

    // Subscribe to Threats
    const threatsQuery = query(
      collection(db, 'threats'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeThreats = onSnapshot(threatsQuery, (snapshot) => {
      const threatData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Threat[];
      setThreats(threatData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'threats');
    });

    // Subscribe to User Stats
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeStats = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as UserStats);
      } else {
        // Initialize user stats if not exists
        const initialStats: UserStats = {
          scansPerformed: 0,
          threatsDetected: 0,
          threatsBlocked: 0,
          securityScore: 100,
        };
        setDoc(userDocRef, initialStats).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => {
      unsubscribeThreats();
      unsubscribeStats();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleScanResult = async (threatData: Omit<Threat, 'id'>) => {
    if (!user) return;

    try {
      // 1. Save Threat to Firestore
      const threatRef = collection(db, 'threats');
      try {
        await addDoc(threatRef, {
          ...threatData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'threats');
      }

      // 2. Update Stats
      const userDocRef = doc(db, 'users', user.uid);
      const newStats = {
        scansPerformed: stats.scansPerformed + 1,
        threatsDetected: threatData.status === 'blocked' ? stats.threatsDetected + 1 : stats.threatsDetected,
        threatsBlocked: threatData.status === 'blocked' ? stats.threatsBlocked + 1 : stats.threatsBlocked,
        securityScore: threatData.status === 'blocked' ? Math.min(100, stats.securityScore + 2) : Math.max(0, stats.securityScore - 5),
      };
      try {
        await setDoc(userDocRef, newStats);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }

      // 3. Share anonymized signature if it's a threat
      if (threatData.status === 'blocked') {
        const sigRef = collection(db, 'global-signatures');
        try {
          await addDoc(sigRef, {
            pattern: threatData.content.substring(0, 500), // Simple truncation
            type: threatData.type,
            level: threatData.level,
            createdAt: serverTimestamp(),
            creatorId: user.uid
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'global-signatures');
        }
      }
    } catch (error) {
      // Fallback for unexpected errors
      if (!(error instanceof Error && error.message.includes('authInfo'))) {
        handleFirestoreError(error, OperationType.WRITE, 'scan-result-process');
      }
      throw error;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'scenarios', label: 'HERO MISSIONS', icon: Zap },
    { id: 'scan', label: 'SENTINEL SCAN', icon: Search },
    { id: 'quiz', label: 'AWARENESS HUB', icon: BookOpen },
    { id: 'map', label: 'GLOBAL NETWORK', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-cyber-bg overflow-hidden relative">
      {/* Visual background elements */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="bg-cyber-ink border-r border-slate-800 z-50 flex flex-col items-center py-6"
      >
        <div className="flex items-center gap-3 mb-10 px-4 w-full">
           <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-black" />
           </div>
           {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-white uppercase">CYBER<span className="text-cyan-500">GUARD</span></span>}
        </div>

        <nav className="flex-1 w-full space-y-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                activeView === item.id 
                  ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-xs font-semibold tracking-wide uppercase">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-auto w-full px-3 pt-6 border-t border-slate-800">
           {user ? (
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4 p-3 text-slate-400">
                    <img src={user.photoURL || ''} alt="avatar" className="w-6 h-6 rounded-lg shrink-0 border border-slate-800" referrerPolicy="no-referrer" />
                    {isSidebarOpen && <span className="text-xs font-medium truncate text-white">{user.displayName || 'SENTINEL'}</span>}
                </div>
                <button 
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors group`}
                >
                  <X className="w-5 h-5 shrink-0" />
                  {isSidebarOpen && <span className="text-[10px] font-bold tracking-widest uppercase">LOGOUT</span>}
                </button>
             </div>
           ) : (
             <button 
                onClick={handleLogin}
                className={`w-full flex items-center justify-center p-3 rounded-xl bg-cyan-500 text-black font-bold mb-2 hover:bg-cyan-400 transition-colors`}
              >
                <User className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="ml-2 text-xs uppercase tracking-widest">LOGIN</span>}
              </button>
           )}
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="w-full h-10 flex items-center justify-center text-slate-600 hover:text-white transition-colors"
           >
              {isSidebarOpen ? <Menu className="w-4 h-4 rotate-90" /> : <Menu className="w-4 h-4" />}
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 bg-[#0A0E14]/80 backdrop-blur-md z-40">
           <div className="flex items-center gap-4">
              <h1 className="text-sm font-bold tracking-widest text-white uppercase">{activeView.replace('_', ' ')}</h1>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Analyzer Active</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400 mr-4">
                <span className="text-white">Active Session: CG-8921-X</span>
              </div>
              <button className="p-2 bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-colors rounded-xl">
                 <Settings className="w-4 h-4 text-slate-400" />
              </button>
           </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                  <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase">Initializing Defence Systems...</p>
                </div>
              ) : (
                <>
                  {activeView === 'dashboard' && <Dashboard threats={threats} stats={stats} />}
                  {activeView === 'scenarios' && <HeroMissions user={user} onScanResult={handleScanResult} />}
                  {activeView === 'scan' && (
                    user ? (
                      <ThreatScanner onScanResult={handleScanResult} />
                    ) : (
                      <div className="cyber-panel p-12 text-center space-y-6">
                        <ShieldAlert className="w-16 h-16 text-cyber-amber mx-auto" />
                        <h2 className="text-xl font-mono text-white uppercase tracking-widest">Sentinel Access Restricted</h2>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">You must initialize your Guard Identity to access deep scanning and analysis tools. Login with your secure credentials to proceed.</p>
                        <button 
                          onClick={handleLogin}
                          className="px-8 py-3 bg-cyber-blue text-black font-mono font-bold text-xs uppercase hover:bg-cyber-blue/80 transition-all"
                        >
                          Initialize Secure Login
                        </button>
                      </div>
                    )
                  )}
                  {activeView === 'quiz' && <QuizHub />}
                  {activeView === 'map' && <GlobalMap />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="h-12 bg-black/40 border-t border-slate-800 px-8 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-[0.2em] relative z-40 backdrop-blur-sm">
          <div className="font-bold">Sentinel Engine v4.0.21 | Signature DB: 12.04.2023.1</div>
          <div className="flex gap-8 font-bold">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" /> Uplink Active</span>
            <span className="text-cyan-500">Secure Session ID: CG-8921-X</span>
          </div>
        </footer>
      </main>
      
      {/* Decoys & Decor */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-rose-500/5 blur-[120px] pointer-events-none" />
    </div>
  );
}
