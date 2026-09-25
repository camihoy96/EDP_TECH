import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SecurityEvent {
  type: string;
  title: string;
  message: string;
  ip?: string;
  device?: string;
  platform?: string;
  deviceClass?: string;
  computerName?: string;
  at?: string;
}

@Injectable({ providedIn: 'root' })
export class SecurityEventsService {
  private eventSource: EventSource | null = null;
  private readonly events$ = new Subject<SecurityEvent>();

  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private readonly MAX_BACKOFF = 30000;
  private manuallyDisconnected = false;

  constructor(private zone: NgZone) {}

  get events() {
    return this.events$.asObservable();
  }

  connect() {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      console.log('🟡 SecurityEventsService: already connected');
      return;
    }

    this.manuallyDisconnected = false;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn('🔴 SecurityEventsService: no token, skipping SSE connect');
      return;
    }

    const url = `${environment.apiUrl}/api/auth/security-stream?token=${encodeURIComponent(token)}`;
    console.log('🟢 SecurityEventsService: opening SSE');

    try {
      this.eventSource = new EventSource(url);
    } catch (err) {
      console.error('❌ SecurityEventsService: EventSource creation failed', err);
      this.scheduleReconnect();
      return;
    }

    this.eventSource.onopen = () => {
      console.log('✅ SecurityEventsService: SSE connected');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (ev) => {
      try {
        const data: SecurityEvent = JSON.parse(ev.data);
        console.log('📨 SecurityEventsService:', data);
        if (data.type === 'connected') return;
        this.zone.run(() => this.events$.next(data));
      } catch (e) {
        console.warn('Bad SSE payload:', e);
      }
    };

    this.eventSource.onerror = (err) => {
      console.warn('⚠️ SecurityEventsService: SSE error, will reconnect', err);
      this.eventSource?.close();
      this.eventSource = null;
      if (!this.manuallyDisconnected) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.MAX_BACKOFF);
    this.reconnectAttempts++;
    console.log(`🔄 SecurityEventsService: reconnecting in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.log('🛑 SecurityEventsService: no token on retry, stopping');
        return;
      }
      this.connect();
    }, delay);
  }

  disconnect() {
    console.log('🛑 SecurityEventsService: disconnecting (manual)');
    this.manuallyDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
    this.reconnectAttempts = 0;
  }
}