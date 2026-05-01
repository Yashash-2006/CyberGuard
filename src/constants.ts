/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThreatLevel, QuizQuestion } from './types';

export const INITIAL_QUIZZES: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'You receive an SMS from a "bank" saying your account is suspended and asking you to click a link. What is this?',
    options: ['Legitimate alert', 'Phishing attempt', 'Bank error', 'System update'],
    correctAnswer: 1,
    explanation: 'Banks almost never ask you to click links in SMS to "unsuspend" accounts. This is a classic social engineering tactic.',
  },
  {
    id: 'q2',
    question: 'A friend forwards a WhatsApp message about a "Government Subsidy". What should you do?',
    options: [
      'Click the link immediately',
      'Forward it to others',
      'Verify the official government website first',
      'Enter your details to check eligibility'
    ],
    correctAnswer: 2,
    explanation: 'Social media forwards are common vectors for scams. Always verify through official channels.',
  },
  {
    id: 'q3',
    question: 'What is "Social Engineering" in cybersecurity?',
    options: [
      'Building better social networks',
      'Manipulating people into giving up confidential information',
      'Programming social media algorithms',
      'Hardware firewalls'
    ],
    correctAnswer: 1,
    explanation: 'Social engineering targets the "human element" of security through psychological manipulation.',
  }
];

export const MOCK_THREAT_SIGNATURES = [
  { pattern: 'gov-subsidy-2026.com', type: 'URL', level: ThreatLevel.HIGH },
  { pattern: 'account-verify-bank.com', type: 'URL', level: ThreatLevel.CRITICAL },
  { pattern: 'Win a $1000 gift card', type: 'SMS', level: ThreatLevel.MEDIUM },
  { pattern: 'urgent: suspicious activity detected', type: 'SMS', level: ThreatLevel.HIGH },
];

export const MOCK_APP_BEHAVIORS = [
  {
    appName: 'Flashlight Ultra',
    action: 'Gained Contact Access',
    category: 'permission',
    severity: ThreatLevel.HIGH,
    details: 'Utility app requested sensitive contact list data.',
    isSuspicious: true
  },
  {
    appName: 'QuickScan PDF',
    action: 'Network Uplink to Unknown IP',
    category: 'network',
    severity: ThreatLevel.MEDIUM,
    details: 'Background data transfer to 185.122.x.x detected.',
    isSuspicious: true
  },
  {
    appName: 'WhatsApp',
    action: 'Sent Message',
    category: 'data',
    severity: ThreatLevel.LOW,
    details: 'Standard outgoing encrypted communication.',
    isSuspicious: false
  },
  {
    appName: 'Photo Editor Pro',
    action: 'Accessed GPS in Background',
    category: 'permission',
    severity: ThreatLevel.HIGH,
    details: 'Continuous location tracking without active UI.',
    isSuspicious: true
  },
  {
    appName: 'System Update',
    action: 'Modified File Permissions',
    category: 'data',
    severity: ThreatLevel.CRITICAL,
    details: 'Unsigned binary attempted to escalate privileges.',
    isSuspicious: true
  }
];

export const ONBOARDING_STEPS = [
  {
    target: 'dashboard',
    title: 'Security Control Center',
    content: 'Welcome to CyberGuard. This is your central hub for monitoring system health and active threat vectors.',
    icon: 'LayoutDashboard'
  },
  {
    target: 'scan',
    title: 'Sentinel AI Scanner',
    content: 'Manually scan messages, URLs, or files. Our Gemini-powered AI identifies social engineering patterns in real-time.',
    icon: 'Search'
  },
  {
    target: 'scenarios',
    title: 'Hero Missions',
    content: 'Simulate sophisticated cyber-attacks to see how Sentinel intercepts them. Learn by experiencing the frontlines.',
    icon: 'Zap'
  },
  {
    target: 'behavior',
    title: 'Behavior Analysis Lab',
    content: 'Monitor application permissions and network activity. Detect malware by its digital behavior, not just its name.',
    icon: 'Activity'
  },
  {
    target: 'quiz',
    title: 'Awareness Hub',
    content: 'Enhance your security intuition. Complete trials to build resistance against modern psychological manipulation.',
    icon: 'BookOpen'
  }
];
