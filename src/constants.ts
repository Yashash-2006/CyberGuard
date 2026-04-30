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
