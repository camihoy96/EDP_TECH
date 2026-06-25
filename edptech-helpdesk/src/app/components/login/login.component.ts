import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; 
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="root">

      <!-- ── Animated background ── -->
      <div class="bg" aria-hidden="true">
        <div class="bg-grid"></div>
        <div class="bg-vignette"></div>
        <div class="beam beam-1"></div>
        <div class="beam beam-2"></div>
        <div class="beam beam-3"></div>
        <div class="corner-mark cm-tl">EDPtech / SECURE</div>
        <div class="corner-mark cm-tr">SYS.v2.0</div>
        <div class="corner-mark cm-bl">{{ currentTime }}</div>
        <div class="corner-mark cm-br">TLS 1.3 · RBAC</div>
      </div>

      <!-- ── Card ── -->
      <div class="card">

        <!-- ─── LEFT PANEL WITH VIDEO ─────────── -->
        <div class="card-left">
          <!-- Video Background -->
          <div class="video-bg">
            <video autoplay muted loop playsinline class="bg-video">
              <source src="assets/videos/cyber.mp4" type="video/mp4">
              <div class="video-fallback"></div>
            </video>
            <div class="video-overlay"></div>
          </div>

          <div class="card-left-content">
            <div class="brand-strip">
              <div class="brand-hex">
                <img src="assets/images/logo.png" alt="Logo" width="35" height="26">
              </div>
              <div>
                <div class="brand-name">EDPtech</div>
                <div class="brand-tagline">IT Operations &amp; Helpdesk</div>
              </div>
              <div class="brand-ver">v2.0</div>
            </div>

            <div class="left-hero">
              <div class="hero-label">SECURE ACCESS PORTAL</div>
              <h2 class="hero-title">Centralized<br><em>IT Support</em></h2>
              <p class="hero-body">Real-time ticket management, SLA enforcement, and role-based access for your entire organization.</p>
            </div>

            <div class="tile-grid">
              <div class="tile" *ngFor="let f of features">
                <div class="tile-icon">{{ f.icon }}</div>
                <div class="tile-text">
                  <div class="tile-title">{{ f.title }}</div>
                  <div class="tile-desc">{{ f.desc }}</div>
                </div>
              </div>
            </div>

            <div class="left-footer">
              <div class="sys-row">
                <div class="sys-dot"></div>
                <span class="sys-label">All Systems Operational</span>
                <div class="uptime-bar">
                  <div class="uptime-seg" *ngFor="let s of uptimeSegs" [class.down]="!s"></div>
                </div>
                <span class="uptime-pct">99.9%</span>
              </div>
              <div class="ticker">
                <span class="ticker-label">SEC</span>
                <span class="ticker-text" *ngFor="let m of tickerMsgs; let i = index" [class.show]="i === tickerIndex">{{ m }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── RIGHT PANEL WITH BACKGROUND IMAGE ─── -->
        <div class="card-right">
          <!-- Background Image -->
          <div class="right-bg"></div>
          <div class="right-overlay"></div>

          <div class="login-container">
            <div class="pane-head">
              <h3 class="pane-title">Welcome</h3>
              <p class="pane-sub">Authorized personnel only. Session will be recorded.</p>
            </div>

            <div class="alert a-err" *ngIf="loginError">
              <span class="a-ico">!</span>
              <div><div class="a-title">Authentication Failed</div><div class="a-msg">{{ loginError }}</div></div>
            </div>
            <div class="alert a-warn" *ngIf="failedAttempts >= 2 && !loginError && !locked">
              <span class="a-ico">⚠</span>
              <div><div class="a-title">Multiple Failed Attempts</div><div class="a-msg">{{ 5 - failedAttempts }} attempt(s) remaining before lockout.</div></div>
            </div>

            <form (ngSubmit)="onLogin()" autocomplete="off" class="form">
              <div class="field">
                <label class="lbl">Username</label>
                <div class="input-wrap">
                  <span class="i-ico"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg></span>
                  <input class="inp" type="text" [(ngModel)]="loginUsername" name="lu" placeholder="Enter username" [disabled]="locked" autocomplete="username" required>
                </div>
              </div>

              <div class="field">
                <label class="lbl">Password <span class="req">*</span></label>
                <div class="input-wrap">
                  <span class="i-ico">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input class="inp" [type]="showLoginPw ? 'text' : 'password'" [(ngModel)]="loginPassword" name="lp" placeholder="Enter password" required>
                  <button type="button" class="eye" (click)="showLoginPw = !showLoginPw" tabindex="-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path *ngIf="!showLoginPw" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle *ngIf="!showLoginPw" cx="12" cy="12" r="3"/>
                      <line *ngIf="showLoginPw" x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </button>
                </div>
              </div>

              <button class="submit-btn" type="submit" [disabled]="loginLoading || locked">
                <span class="spin" *ngIf="loginLoading"></span>
                <span>{{ loginLoading ? 'Authenticating…' : 'Login' }}</span>
                <svg *ngIf="!loginLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </form>

            <div class="forgot-row">
              <button type="button" class="forgot-link" (click)="showForgotPassword = true">
                Forgot your password?
              </button>
            </div>

            <div class="divider-row">
              <span class="divider-line"></span>
              <span class="divider-text">or</span>
              <span class="divider-line"></span>
            </div>

            <button class="signup-btn" (click)="goToSignup()" type="button">
              <span>Create New Account</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          <div class="card-foot">EDPtech Helpdesk v2.0 &nbsp;·&nbsp; © 2024 IT Operations Division</div>
        </div>

      </div>

      <!-- Forgot Password Modal -->
      <div class="modal-overlay" *ngIf="showForgotPassword" (click)="showForgotPassword = false">
        <div class="forgot-modal" (click)="$event.stopPropagation()">
          <div class="forgot-header">
            <span class="forgot-icon">🔑</span>
            <h3>Reset Password</h3>
            <button class="modal-close" (click)="showForgotPassword = false">✕</button>
          </div>
          <div class="forgot-body">
            <div class="forgot-step" *ngIf="forgotStep === 1">
              <p>Enter your email address to request a password reset. Your IT administrator will provide the reset code.</p>
              <div class="field">
                <label class="lbl">Email Address</label>
                <div class="input-wrap">
                  <span class="i-ico">📧</span>
                  <input class="inp" type="email" [(ngModel)]="forgotEmail" placeholder="you@edptech.com">
                </div>
              </div>
              <button class="submit-btn" (click)="sendResetCode()" [disabled]="forgotLoading || !forgotEmail">
                {{ forgotLoading ? '⏳ Processing...' : 'Request Reset Code' }}
              </button>
              <p class="forgot-error" *ngIf="forgotError">{{ forgotError }}</p>
              <p class="forgot-success" *ngIf="forgotSuccess">{{ forgotSuccess }}</p>
            </div>

            <div class="forgot-step" *ngIf="forgotStep === 2">
              <p>Enter the 6-digit reset code provided by your IT administrator for <strong>{{ forgotEmail }}</strong></p>
              <div class="field">
                <label class="lbl">Reset Code</label>
                <div class="input-wrap">
                  <span class="i-ico">🔢</span>
                  <input class="inp key-inp" type="text" [(ngModel)]="resetCode" placeholder="000000" maxlength="6">
                </div>
              </div>
              <div class="field">
                <label class="lbl">New Password</label>
                <div class="input-wrap">
                  <span class="i-ico">🔒</span>
                  <input class="inp" [type]="showResetPw ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="Min. 6 characters">
                  <button type="button" class="eye" (click)="showResetPw = !showResetPw">👁</button>
                </div>
              </div>
              <button class="submit-btn" (click)="resetPassword()" [disabled]="forgotLoading || !resetCode || !newPassword">
                {{ forgotLoading ? '⏳ Resetting...' : 'Reset Password' }}
              </button>
              <p class="forgot-error" *ngIf="forgotError">{{ forgotError }}</p>
            </div>

            <div class="forgot-step success-step" *ngIf="forgotStep === 3">
              <span class="success-icon">✅</span>
              <h4>Password Reset Successful!</h4>
              <p>You can now login with your new password.</p>
              <button class="submit-btn" (click)="showForgotPassword = false; forgotStep = 1">Back to Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .root {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: #080c12;
      padding: 20px;
      font-family: 'Outfit', sans-serif;
      position: relative;
      overflow: hidden;
    }

    .bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

    .bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,200,120,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,200,120,0.04) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
    }

    .bg-vignette {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, #080c12 80%);
    }

    .beam {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.18;
    }
    .beam-1 { width: 700px; height: 700px; top: -200px; left: -200px; background: #00c878; animation: bm 20s ease-in-out infinite; }
    .beam-2 { width: 500px; height: 500px; bottom: -100px; right: -100px; background: #00a8ff; animation: bm 26s ease-in-out infinite reverse; }
    .beam-3 { width: 360px; height: 360px; top: 50%; left: 55%; background: #50fa7b; opacity: 0.08; animation: bm 16s ease-in-out infinite 8s; }
    @keyframes bm {
      0%,100% { transform: translate(0,0) scale(1); }
      33%      { transform: translate(60px,80px) scale(1.1); }
      66%      { transform: translate(-40px,30px) scale(0.9); }
    }

    .corner-mark {
      position: absolute;
      font-family: 'Inconsolata', monospace;
      font-size: 9px; letter-spacing: 0.15em;
      color: rgba(255, 255, 255, 0.86); text-transform: uppercase;
    }
    .cm-tl { top: 16px; left: 20px; }
    .cm-tr { top: 16px; right: 20px; }
    .cm-bl { bottom: 16px; left: 20px; }
    .cm-br { bottom: 16px; right: 20px; }

    .card { 
      display: flex;
      width: 100%; 
      max-width: 1040px;
      min-height: 620px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid rgba(0,200,120,0.15);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 60px 120px rgba(0,0,0,0.8);
      position: relative; z-index: 2;
      animation: cardIn 0.6s cubic-bezier(.16,1,.3,1) both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(40px) scale(0.96); }
      to   { opacity: 1; transform: none; }
    }

    /* ─── LEFT PANEL WITH VIDEO ─── */
    .card-left {
      width: 420px;
      min-width: 380px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 32px 28px;
    }

    .video-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .bg-video {
      position: absolute;
      top: 50%;
      left: 50%;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      transform: translate(-50%, -50%);
      object-fit: cover;
    }

    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(160deg, rgba(13, 20, 36, 0.18) 0%, rgba(10,16,32,0.88) 100%);
      z-index: 1;
    }

    .video-fallback {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(160deg, #0d1424 0%, #0a1020 100%);
      z-index: 0;
    }

    .card-left-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-left::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #00c878, #00a8ff, transparent);
      z-index: 3;
    }

    .brand-strip { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; position: relative; z-index: 2; }
    .brand-hex {
      width: 44px; height: 44px;
      background: rgba(0,200,120,0.15);
      border: 1px solid rgba(0,200,120,0.25);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      backdrop-filter: blur(4px);
    }
    .brand-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #e8f4f0; letter-spacing: -0.3px; text-shadow: 0 2px 20px rgba(0,0,0,0.3); }
    .brand-tagline { font-size: 10px; color: rgba(255,255,255,0.7); letter-spacing: 0.05em; margin-top: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    .brand-ver {
      margin-left: auto;
      font-family: 'Inconsolata', monospace;
      font-size: 10px; color: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 3px 7px; border-radius: 3px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .left-hero { margin-bottom: 24px; position: relative; z-index: 2; }
    .hero-label {
      font-family: 'Inconsolata', monospace;
      font-size: 9px; letter-spacing: 0.18em;
      color: rgba(254, 255, 255, 0.8); margin-bottom: 10px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .hero-title {
      font-family: 'Syne', sans-serif;
      font-size: 30px; font-weight: 800;
      color: #d8eee8; line-height: 1.15;
      letter-spacing: -0.8px; margin-bottom: 12px;
      text-shadow: 0 4px 30px rgba(0,0,0,0.4);
    }
    .hero-title em {
      font-style: normal;
      background: linear-gradient(90deg, #00c878, #50fa7b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-body { font-size: 12px; color: rgba(232,235,233,0.8); line-height: 1.7; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }

    .tile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex: 1; margin-bottom: 24px; position: relative; z-index: 2; }
    .tile {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 11px;
      background: rgba(0,200,120,0.06);
      border: 1px solid rgba(0,200,120,0.12);
      border-radius: 6px;
      transition: border-color 0.2s, background 0.2s;
      backdrop-filter: blur(4px);
    }
    .tile:hover { border-color: rgba(0,200,120,0.22); background: rgba(0,200,120,0.1); }
    .tile-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
    .tile-title { font-size: 11px; font-weight: 600; color: rgba(138,184,168,0.9); margin-bottom: 2px; }
    .tile-desc  { font-size: 10px; color: rgba(182,176,176,0.7); line-height: 1.4; }

    .left-footer { margin-top: auto; position: relative; z-index: 2; }
    .sys-row {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 10px;
      background: rgba(0,200,120,0.06);
      border: 1px solid rgba(0,200,120,0.12);
      border-radius: 5px; margin-bottom: 8px;
      backdrop-filter: blur(4px);
    }
    .sys-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00c878; flex-shrink: 0;
      box-shadow: 0 0 8px #00c878;
      animation: sysP 2s ease-in-out infinite;
    }
    @keyframes sysP { 0%,100%{opacity:1}50%{opacity:0.3} }
    .sys-label { font-size: 10px; color: rgba(253,255,254,0.8); flex: 1; }
    .uptime-bar { display: flex; gap: 2px; }
    .uptime-seg { width: 3px; height: 10px; background: rgba(0,200,120,0.3); border-radius: 1px; }
    .uptime-seg.down { background: rgba(255,80,80,0.3); }
    .uptime-pct { font-family: 'Inconsolata', monospace; font-size: 10px; color: rgba(255,255,255,0.7); }

    .ticker {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 9px;
      background: rgba(255,200,0,0.04);
      border: 1px solid rgba(255,200,0,0.08);
      border-radius: 5px;
      overflow: hidden; position: relative; height: 28px;
      backdrop-filter: blur(4px);
    }
    .ticker-label {
      font-family: 'Inconsolata', monospace;
      font-size: 8px; font-weight: 600; letter-spacing: 0.12em;
      color: rgba(240, 238, 235, 0.8);
      background: rgba(255,180,0,0.08);
      padding: 2px 5px; border-radius: 2px; flex-shrink: 0;
    }
    .ticker-text {
      font-size: 10px; color: rgba(255, 255, 255, 0.8);
      white-space: nowrap; position: absolute; left: 52px;
      opacity: 0; transition: opacity 0.5s;
    }
    .ticker-text.show { opacity: 1; }

    /* ─── RIGHT PANEL WITH BACKGROUND IMAGE ─── */
    .card-right { 
      flex: 1; 
      position: relative;
      overflow: hidden;
      display: flex; 
      flex-direction: column; 
      min-width: 0;
    }

    .right-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/images/bg.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
    }

    .right-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgb(255, 255, 255);
      z-index: 1;
    }

    .login-container {
      padding: 40px 40px 20px;
      overflow-y: auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
      position: relative;
      z-index: 2;
    }
    .login-container::-webkit-scrollbar { width: 3px; }
    .login-container::-webkit-scrollbar-thumb { background: rgba(0, 200, 120, 0.06); border-radius: 2px; }

    .pane-head { margin-bottom: 20px; }
    .pane-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #0a0a0a; letter-spacing: -0.4px; margin-bottom: 4px; }
    .pane-sub { font-size: 11px; color: #4b4949; }

    .alert {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 12px; border-radius: 5px;
      font-size: 11px; margin-bottom: 16px;
    }
    .a-ico  { font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .a-title { font-weight: 600; margin-bottom: 2px; font-size: 11px; color: rgb(2, 2, 2); }
    .a-msg   { font-size: 10px; opacity: 0.75; color: rgb(23, 26, 24);}
    .a-err  { background: rgba(255,60,60,0.08);  border: 1px solid rgba(255,60,60,0.2);  color: #ff9090; }
    .a-warn { background: rgba(255,180,0,0.08);  border: 1px solid rgba(255,180,0,0.2);  color: #ffd060; }

    .form { 
      display: flex; 
      flex-direction: column; 
      width: 100%;
      max-width: 380px;
      margin: 0 auto;
    }
    .field { 
      margin-bottom: 16px;
      width: 100%;
    }
    .lbl {
      display: block;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #2a5040;
      margin-bottom: 5px;
    }
    .req { color: rgba(0,200,120,0.6); }

    .input-wrap { 
      position: relative; 
      display: flex; 
      align-items: center;
      width: 100%;
    }
    .i-ico { 
      position: absolute; 
      left: 12px; 
      color: #050505; 
      display: flex; 
      pointer-events: none;
      z-index: 1;
    }

    .inp {
      width: 100%;
      background: rgba(253, 253, 253, 0.9);
      border: 1px solid #141e28;
      border-radius: 5px;
      color: #000000;
      padding: 10px 36px 10px 38px;
      font-size: 13px;
      font-family: 'Outfit', sans-serif;
      transition: border-color 0.15s, box-shadow 0.15s;
      backdrop-filter: blur(4px);
    }
    .inp::placeholder { 
      color: #999;
      font-size: 12px;
    }
    .inp:focus { 
      outline: none; 
      border-color: rgba(0,200,120,0.4); 
      box-shadow: 0 0 0 3px rgba(0,200,120,0.07); 
    }
    .inp:disabled { opacity: 0.35; cursor: not-allowed; }

    .eye {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #0c0e0d;
      display: flex;
      align-items: center;
      padding: 4px;
      transition: color 0.15s;
      z-index: 1;
    }
    .eye:hover { color: #253b32; }

    .forgot-row { 
      text-align: center; 
      margin-top: 12px;
      width: 100%;
      max-width: 380px;
      margin-left: auto;
      margin-right: auto;
    }
    .forgot-link {
      background: none; 
      border: none; 
      color: #2a5040;
      font-size: 12px; 
      cursor: pointer; 
      text-decoration: underline;
    }
    .forgot-link:hover { color: #00c878; }

    .divider-row {
      display: flex; 
      align-items: center; 
      gap: 12px;
      margin: 16px auto 12px;
      width: 100%;
      max-width: 380px;
    }
    .divider-line { flex: 1; height: 1px; background: rgba(0,200,120,0.15); }
    .divider-text { font-size: 12px; color: #1e3a2a; white-space: nowrap; }

    .signup-btn {
      width: 45%;
      max-width: 380px;
      margin: 0 auto;
      background: #7b3af3;
      border: 1px solid rgba(123,58,243,0.35);
      border-radius: 5px;
      color: #ffffff;
      padding: 12px 20px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Syne', sans-serif;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s;
    }
    .signup-btn:hover {
      background: #6a2fd6;
      border-color: #7b3af3;
      box-shadow: 0 0 20px rgba(123,58,243,0.2);
      transform: translateY(-1px);
    }

    .submit-btn {
      width: 45%;
      max-width: 380px;
      margin: 4px auto 0;
      background: rgba(87, 230, 4, 0.99);
      border: 1px solid rgba(0,200,120,0.35);
      border-radius: 5px;
      color: #000000;
      padding: 12px 20px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Syne', sans-serif;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    .submit-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(38, 12, 100, 0.97), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .submit-btn:hover:not(:disabled)::before { opacity: 1; }
    .submit-btn:hover:not(:disabled) {
      border-color: rgba(0,200,120,0.7);
      box-shadow: 0 0 20px rgba(0,200,120,0.15), 0 0 40px rgba(0,200,120,0.05);
      transform: translateY(-1px);
    }
    .submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .spin {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(0,200,120,0.3);
      border-top-color: #00c878;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .card-foot {
      padding: 9px 32px;
      border-top: 1px solid rgba(0,200,120,0.08);
      background: rgba(0,200,120,0.02);
      font-size: 10px;
      color: #162218;
      letter-spacing: 0.02em;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }

    /* Forgot Password Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .forgot-modal {
      background: white; 
      border-radius: 12px; 
      width: 90%; 
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4); 
      overflow: hidden;
    }
    .forgot-header {
      display: flex; 
      align-items: center; 
      gap: 10px;
      padding: 16px 20px; 
      background: #10172e; 
      color: white;
    }
    .forgot-icon { font-size: 20px; }
    .forgot-header h3 { margin: 0; font-size: 16px; flex: 1; }
    .forgot-body { padding: 24px; }
    .forgot-body p { font-size: 12px; color: #555; margin: 0 0 16px 0; line-height: 1.5; }
    .forgot-body .field { margin-bottom: 14px; }
    .forgot-body .submit-btn { width: 100%; margin-left: 0; }
    .forgot-error { color: #cc0000 !important; font-size: 11px !important; margin-top: 8px !important; }
    .forgot-success { color: #008800 !important; font-size: 11px !important; margin-top: 8px !important; }
    .success-step { text-align: center; }
    .success-icon { font-size: 40px; display: block; margin-bottom: 12px; }
    .success-step h4 { margin: 0 0 8px 0; color: #008800; }

    .modal-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 28px; 
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover { background: rgba(255,0,0,0.4); }

    @media (max-width: 860px) {
      .card { flex-direction: column; max-width: 520px; }
      .card-left { width: 100%; min-width: unset; border-right: none; border-bottom: 1px solid rgba(0,200,120,0.12); min-height: 300px; }
      .tile-grid { grid-template-columns: 1fr 1fr; }
      .login-container { padding: 30px 24px 16px; }
    }
    @media (max-width: 560px) {
      .root { padding: 10px; }
      .card-left { padding: 24px 20px; min-height: 250px; }
      .tile-grid { grid-template-columns: 1fr; }
      .login-container { padding: 22px 16px 16px; }
      .card-foot { padding: 9px 16px; }
      .corner-mark { display: none; }
      .form { max-width: 100%; }
      .submit-btn, .signup-btn, .divider-row, .forgot-row { max-width: 100%; }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginUsername  = '';
  loginPassword  = '';
  loginLoading   = false;
  loginError     = '';
  showLoginPw    = false;
  capsLock       = false;
  failedAttempts = 0;
  locked         = false;
  lockoutRemaining = 30;
  showForgotPassword = false;
  forgotStep = 1;
  forgotEmail = '';
  resetCode = '';
  newPassword = '';
  showResetPw = false;
  forgotLoading = false;
  forgotError = '';
  forgotSuccess = '';

  currentTime = '';
  tickerIndex = 0;
  uptimeSegs  = Array.from({ length: 24 }, (_, i) => i !== 7);

  readonly features = [
    { icon: '🔐', title: 'End-to-End Encrypted',  desc: 'All data via TLS 1.3' },
    { icon: '🛡️', title: 'Role-Based Access',      desc: 'Admin, Agent, User tiers' },
    { icon: '📋', title: 'Full Audit Trail',        desc: 'Every action logged' },
    { icon: '⏱️', title: 'SLA Enforcement',         desc: 'Auto-escalation rules' },
  ];

  readonly tickerMsgs = [
    'Login attempts are monitored and logged',
    'Unauthorized access violates company policy',
    'Report security incidents to IT immediately',
    'Never share your credentials with anyone',
  ];

  private clockInterval:   any;
  private tickerInterval:  any;
  private lockoutInterval: any;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.updateTime();
    this.clockInterval = setInterval(() => this.updateTime(), 1000);
    this.tickerInterval = setInterval(() => {
      this.tickerIndex = (this.tickerIndex + 1) % this.tickerMsgs.length;
    }, 4000);
  }

  ngOnDestroy() {
    clearInterval(this.clockInterval);
    clearInterval(this.tickerInterval);
    clearInterval(this.lockoutInterval);
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  checkCapsLock(e: KeyboardEvent) {
    this.capsLock = e.getModifierState?.('CapsLock') ?? false;
  }
  
  goToSignup() {
    this.router.navigate(['/signup']);
  }

  onLogin() {
    if (!this.loginUsername || !this.loginPassword) {
      this.loginError = 'Username and password are required';
      return;
    }

    this.loginLoading = true;
    this.loginError = '';
    
    console.log('🔐 Attempting login:', { username: this.loginUsername });
    
    this.authService.login(this.loginUsername, this.loginPassword).subscribe({
      next: (response) => { 
        console.log('✅ Login success');
        this.loginLoading = false;
        this.failedAttempts = 0;
        
        const user = response.user;
        const userTable = user?.user_table || '';
        
        console.log('👤 User logged in:', { 
          username: user?.username, 
          role: user?.role, 
          table: userTable,
          department: user?.department,
          branch_id: user?.branch_id
        });
        
        // Determine redirect based on user table and role
        // Users from 'new_user' table or with role 'user' go to client dashboard
        // Users from 'users' table (EDP) or with admin/Technician roles go to admin dashboard
        if (userTable === 'new_user' || user?.role === 'user') {
          this.router.navigate(['/client/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        this.loginLoading = false;
        this.failedAttempts++;
        
        if (error.status === 0) {
          this.loginError = 'Cannot connect to server. Is the backend running?';
        } else if (error.status === 401) {
          this.loginError = 'Invalid username or password';
        } else if (error.status === 423) {
          this.loginError = error.error?.message || 'Account is locked. Please try again later.';
        } else {
          this.loginError = error.error?.message || 'Login failed. Please try again.';
        }
        
        this.loginPassword = '';
      }
    });
  }

  startLockoutTimer() {
    this.lockoutRemaining = 30;
    this.lockoutInterval = setInterval(() => {
      this.lockoutRemaining--;
      if (this.lockoutRemaining <= 0) {
        clearInterval(this.lockoutInterval);
        this.locked = false;
        this.failedAttempts = 0;
        this.loginError = '';
      }
    }, 1000);
  }

  // =============================================
  // FORGOT PASSWORD
  // =============================================
  
  sendResetCode() {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotSuccess = '';
    
    this.http.post(`${environment.apiUrl}/api/auth/forgot-password`, { email: this.forgotEmail })
      .subscribe({
        next: (res: any) => {
          this.forgotLoading = false;
          
          if (res.code) {
            this.resetCode = res.code;
          }
          
          this.forgotSuccess = 'Code generated! Enter it below to reset your password.';
          
          setTimeout(() => {
            this.forgotStep = 2;
            this.forgotSuccess = '';
          }, 1000);
        },
        error: (err) => {
          this.forgotLoading = false;
          this.forgotError = err.error?.message || 'Failed to generate reset code.';
        }
      });
  }

  resetPassword() {
    if (!this.resetCode || !this.newPassword) return;
    this.forgotLoading = true;
    this.forgotError = '';
    
    this.http.post(`${environment.apiUrl}/api/auth/reset-password`, {
      email: this.forgotEmail,
      code: this.resetCode,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.forgotLoading = false;
        this.forgotStep = 3;
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Invalid code. Please try again.';
      }
    });
  }
}