/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Threat {
  id: string;
  type: 'SMS' | 'Call' | 'App' | 'URL';
  source: string;
  content: string;
  timestamp: string;
  level: ThreatLevel;
  status: 'pending' | 'blocked' | 'dismissed';
  analysis: string;
}

export interface UserStats {
  scansPerformed: number;
  threatsDetected: number;
  threatsBlocked: number;
  securityScore: number; // 0-100
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface BehaviorEvent {
  id: string;
  timestamp: string;
  appName: string;
  action: string;
  category: 'permission' | 'network' | 'data';
  severity: ThreatLevel;
  details: string;
  isSuspicious: boolean;
}

export interface AppProfile {
  name: string;
  packageName: string;
  permissions: string[];
  riskScore: number;
}
