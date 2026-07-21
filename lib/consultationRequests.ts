import { ConsultationRequest } from './types';

const KEY = 'claim-guardian:consultation-requests';

function readAll(): ConsultationRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConsultationRequest[]) : [];
  } catch {
    return [];
  }
}

export function listConsultationRequests(): ConsultationRequest[] {
  return readAll().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveConsultationRequest(entry: ConsultationRequest) {
  const all = readAll().filter((request) => request.id !== entry.id);
  all.push(entry);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
