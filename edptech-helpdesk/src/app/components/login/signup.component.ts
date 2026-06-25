import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="signup-root">

      <!-- ── Ambient background ── -->
      <div class="bg" aria-hidden="true">
        <div class="bg-noise"></div>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <!-- ── Main shell ── -->
      <div class="shell">

        <!-- LEFT PANEL -->
        <aside class="left-panel">
          <div class="video-bg">
            <video autoplay muted loop playsinline class="bg-video">
              <source src="/assets/videos/helpdesk-bg.mp4" type="video/mp4">
              <div class="video-fallback"></div>
            </video>
            <div class="video-overlay"></div>
          </div>
          
          <div class="lp-inner">
            <div class="lp-logo">
              <div class="logo-ring">
                <img src="assets/images/logo.png" alt="EDPtech Logo" width="36" height="27">
              </div>
              <div class="logo-text">
                <span class="logo-name">EDPtech</span>
                <span class="logo-sub">IT Operations &amp; Helpdesk</span>
              </div>
            </div>

            <div class="lp-hero">
              <h1 class="lp-headline">Secure<br>Access<br>Portal</h1>
              <p class="lp-body">Create your account to start managing IT support requests across all branches.</p>
            </div>

            <div class="status-rail">
              <div class="rail-item">
                <span class="rail-dot active"></span>
                <span class="rail-label">TLS 1.3 Encrypted</span>
              </div>
              <div class="rail-item">
                <span class="rail-dot active"></span>
                <span class="rail-label">RBAC Enforced</span>
              </div>
              <div class="rail-item">
                <span class="rail-dot active"></span>
                <span class="rail-label">RA 10173 Compliant</span>
              </div>
              <div class="rail-item">
                <span class="rail-dot active"></span>
                <span class="rail-label">Audit Logging On</span>
              </div>
            </div>

            <div class="lp-clock">{{ currentTime }}</div>
          </div>
        </aside>

        <!-- RIGHT PANEL -->
        <main class="right-panel">
          <div class="form-wrap">

            <div class="form-head">
              <h2 class="form-title">Create Account</h2>
              <p class="form-sub">Fill in your details to get started.</p>
            </div>

            <div class="alert a-err" *ngIf="signupError" role="alert">
              <span class="alert-ico err-ico">!</span>
              <div>
                <div class="alert-title">Registration Failed</div>
                <div class="alert-msg">{{ signupError }}</div>
              </div>
            </div>
            <div class="alert a-ok" *ngIf="signupSuccess" role="status">
              <span class="alert-ico ok-ico">✓</span>
              <div>
                <div class="alert-title">Account Created!</div>
                <div class="alert-msg">Redirecting you to login…</div>
              </div>
            </div>

           <!-- Branch Selection (Step 1) -->
<div *ngIf="!selectedBranchId" class="branch-selection">
  <p class="branch-prompt">Select your branch to begin registration</p>
  <div class="field">
    <label class="lbl">Branch <span class="req">*</span></label>
    <div class="input-wrap">
      <span class="field-ico">🏢</span>
      <select class="inp" [(ngModel)]="selectedBranchId" name="branch" required (change)="onBranchChange()">
        <option value="">Select Branch</option>
        <option *ngFor="let branch of branches" [value]="branch.id">
          {{ branch.name }}<ng-container *ngIf="branch.company_name"> ({{ branch.company_name }})</ng-container>
        </option>
      </select>
      <span class="select-arrow">▾</span>
    </div>
    <!-- Show loading message if branches are still loading -->
    <div class="loading-hint" *ngIf="!branchesLoaded">Loading branches...</div>
    <!-- Show message if no branches are available -->
    <div class="error-hint" *ngIf="branchesLoaded && branches.length === 0">
      No branches available. Please contact your administrator.
    </div>
  </div>
  <!-- Sign In Link at bottom of branch selection -->
  <div class="login-link-bottom">
    <span class="login-text">Already have an account?</span>
    <button type="button" class="login-link-btn" (click)="goToLogin()">Sign In</button>
  </div>
</div>

            <!-- Registration Form (Step 2) -->
            <form (ngSubmit)="onSignup()" autocomplete="off" class="form" *ngIf="selectedBranchId">

              <!-- Branch Header -->
              <div class="branch-header">
                <span class="branch-label">🏢 {{ getBranchName(selectedBranchId) }}</span>
                <button type="button" class="change-branch-btn" (click)="resetBranchSelection()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Change
                </button>
              </div>

              <div class="form-grid">
                <!-- Department -->
                <div class="field">
                  <label class="lbl">Department <span class="req">*</span></label>
                  <div class="input-wrap">
                    <span class="field-ico">🏛️</span>
                    <select class="inp" [(ngModel)]="selectedDepartmentId" name="dept" required
                      (change)="onDepartmentChange()">
                      <option value="">Select Department</option>
                      <option *ngFor="let dept of branchDepartments" [value]="dept.id">{{ dept.name }}</option>
                    </select>
                    <span class="select-arrow">▾</span>
                  </div>
                </div>

                <!-- Role -->
<div class="field">
  <label class="lbl">Role <span class="req">*</span></label>
  <div class="input-wrap">
    <span class="field-ico">👤</span>
    <select class="inp" [(ngModel)]="reg.role" name="rr" required [disabled]="!selectedDepartmentId">
      <option value="" disabled selected>Select Role</option>
      <option *ngFor="let role of departmentRoles" [value]="role.role_name">
        {{ role.role_name }}
      </option>
    </select>
    <span class="select-arrow">▾</span>
  </div>
</div>

                <!-- Username -->
                <div class="field">
                  <label class="lbl">Username <span class="req">*</span></label>
                  <div class="input-wrap">
                    <span class="field-ico">&#64;</span>
                    <input class="inp" type="text" [(ngModel)]="reg.username" name="ru" placeholder="Username" required autocomplete="off">
                  </div>
                </div>

                <!-- Full Name -->
                <div class="field">
                  <label class="lbl">Full Name <span class="req">*</span></label>
                  <div class="input-wrap">
                    <span class="field-ico">👤</span>
                    <input class="inp" type="text" [(ngModel)]="reg.fullname" name="rf" placeholder="Full Name" required>
                  </div>
                </div>

                <!-- Email -->
                <div class="field">
                  <label class="lbl">Email <span class="req">*</span></label>
                  <div class="input-wrap">
                    <span class="field-ico">✉</span>
                    <input class="inp" type="email" [(ngModel)]="reg.email" name="re" placeholder="Email Address" required>
                  </div>
                </div>

                <!-- Password -->
                <div class="field">
                  <label class="lbl">Password <span class="req">*</span></label>
                  <div class="input-wrap">
                    <span class="field-ico">🔒</span>
                    <input class="inp" [type]="showRegPw ? 'text' : 'password'"
                      [(ngModel)]="reg.password" name="rp" placeholder="Min. 5 chars" required minlength="5">
                    <button type="button" class="eye-btn" (click)="showRegPw = !showRegPw" tabindex="-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <ng-container *ngIf="!showRegPw">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </ng-container>
                        <ng-container *ngIf="showRegPw">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </ng-container>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Confirm Password -->
                <div class="field">
                  <label class="lbl">Confirm <span class="req">*</span></label>
                  <div class="input-wrap" [class.inp-err]="reg.confirmPassword && reg.password !== reg.confirmPassword"
                    [class.inp-ok]="reg.confirmPassword && reg.password === reg.confirmPassword">
                    <span class="field-ico">🔐</span>
                    <input class="inp" type="password" [(ngModel)]="reg.confirmPassword" name="rc" placeholder="Confirm Password" required>
                  </div>
                  <span class="field-err" *ngIf="reg.confirmPassword && reg.password !== reg.confirmPassword">Passwords do not match</span>
                </div>

                <!-- Registration Key -->
                <div class="field full-width">
                  <label class="lbl">Registration Key <span class="req">*</span></label>
                  <div class="input-wrap" [class.inp-ok]="regKeyValid" [class.inp-err]="regKeyInvalid">
                    <span class="field-ico">🔑</span>
                    <input class="inp key-inp" type="text" [(ngModel)]="reg.registrationKey" name="rk"
                      placeholder="Enter registration key" required (input)="validateRegKey()">
                    <span class="key-status ok" *ngIf="regKeyValid">✓</span>
                    <span class="key-status err" *ngIf="regKeyInvalid">✗</span>
                  </div>
                </div>

                <!-- Terms -->
                <div class="terms-box full-width">
                  <label class="terms-check">
                    <input type="checkbox" [(ngModel)]="agreeToTerms" name="agreeTerms" [ngModelOptions]="{standalone: true}">
                    <span class="check-label">
                      I agree to the
                      <button type="button" class="terms-link" (click)="openTermsModal()">Terms of Use</button>
                      and
                      <button type="button" class="terms-link" (click)="openPrivacyModal()">Privacy Policy</button>
                    </span>
                  </label>
                </div>

                <!-- Buttons Row -->
                <div class="button-row full-width">
                  <div class="login-link-wrapper">
                    <span class="login-text">Already have an account?</span>
                    <button type="button" class="login-link-btn" (click)="goToLogin()">Sign In</button>
                  </div>
                  <button class="submit-btn" type="submit" [disabled]="signupLoading || !canSubmitSignup()">
                    <span class="btn-spinner" *ngIf="signupLoading"></span>
                    {{ signupLoading ? 'Creating…' : 'Create Account' }}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </main>

      </div>
    </div>

    <!-- Terms Modal -->
    <div class="modal-backdrop" *ngIf="showTermsModal" (click)="closeTermsModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-header-inner">
            <span class="modal-icon">📜</span>
            <h3>Terms of Use</h3>
          </div>
          <button class="modal-close-btn" (click)="closeTermsModal()">✕</button>
        </div>
        <div class="modal-body">
          <h4>1. Acceptance of Terms</h4>
          <p>By creating an account and using the EDPtech Helpdesk System, you agree to comply with these Terms of Use.</p>
          <h4>2. Authorized Use Only</h4>
          <p>This system is strictly for authorized personnel of EDPtech and its partner organizations.</p>
          <h4>3. Account Responsibility</h4>
          <p>You are responsible for maintaining the confidentiality of your login credentials.</p>
          <h4>4. Acceptable Use Policy</h4>
          <p>You agree not to share credentials, use the system for illegal purposes, or submit false information.</p>
          <h4>5. Data Accuracy</h4>
          <p>You agree to provide accurate and complete information during registration.</p>
          <h4>6. System Monitoring</h4>
          <p>All activities are monitored and logged for security and audit purposes.</p>
          <h4>7. Termination</h4>
          <p>EDPtech reserves the right to suspend or terminate accounts that violate these terms.</p>
          <h4>8. Changes to Terms</h4>
          <p>We may modify these terms at any time. Continued use constitutes acceptance.</p>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" (click)="closeTermsModal()">Cancel</button>
          <button class="modal-accept" (click)="acceptTerms()">Accept</button>
        </div>
      </div>
    </div>

    <!-- Privacy Modal -->
    <div class="modal-backdrop" *ngIf="showPrivacyModal" (click)="closePrivacyModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-header-inner">
            <span class="modal-icon">🔒</span>
            <h3>Privacy Policy</h3>
          </div>
          <button class="modal-close-btn" (click)="closePrivacyModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="privacy-badge">
            <span>Republic Act No. 10173</span>
            <span>Data Privacy Act of 2012</span>
          </div>
          <h4>Information We Collect</h4>
          <p>We collect identity, contact, technical, and profile data to provide IT support services.</p>
          <h4>Purpose of Collection</h4>
          <p>Your data is used for account management, ticket processing, communication, reporting, and compliance.</p>
          <h4>Data Retention</h4>
          <p>Your data is retained while your account is active. Inactive accounts are archived after 2 years.</p>
          <h4>Data Security</h4>
          <p>We use TLS 1.3 encryption, bcrypt password hashing, access controls, and regular security audits.</p>
          <h4>Your Rights</h4>
          <p>You have the right to be informed, access, rectify, erase, restrict, and object to processing of your data.</p>
          <h4>Contact</h4>
          <p>Data Protection Officer: <strong>dpo&#64;edptech.com</strong> · (02) 8123-4567</p>
          <div class="consent-notice">
            <strong>By accepting:</strong> You consent to the collection and processing of your personal information as described, and confirm the information you provide is accurate.
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" (click)="closePrivacyModal()">Cancel</button>
          <button class="modal-accept" (click)="acceptPrivacy()">Accept</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .signup-root {
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      justify-content: center;
      background: #07090f;
      font-family: 'Inter', system-ui, sans-serif;
      position: relative;
      overflow: hidden;
    }

    .bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .bg-noise {
      position: absolute; inset: 0;
      background-image: url("/assets/images/noise.png");
      opacity: 0.4;
    }

    .orb {
      position: absolute; border-radius: 50%;
      filter: blur(100px);
    }
    .orb-1 { width: 600px; height: 600px; top: -150px; left: -100px; background: #4f6ef720; animation: drift 22s ease-in-out infinite; }
    .orb-2 { width: 400px; height: 400px; bottom: -80px; right: -60px; background: #f5a62318; animation: drift 30s ease-in-out infinite reverse; }
    .orb-3 { width: 300px; height: 300px; top: 40%; left: 35%; background: #7c3aed12; animation: drift 18s ease-in-out infinite 5s; }

    @keyframes drift {
      0%, 100% { transform: translate(0, 0); }
      33%       { transform: translate(40px, 60px); }
      66%       { transform: translate(-30px, 20px); }
    }

    .shell {
      display: flex;
      width: 100%;
      min-height: 100vh;
      position: relative;
      z-index: 2;
      animation: shellIn 0.55s cubic-bezier(.16,1,.3,1) both;
    }

    @keyframes shellIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: none; }
    }

    /* ─── LEFT PANEL ─── */
    .left-panel {
      width: 350px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 40px 32px;
      height: 100vh;
      min-height: 100vh;
      border-right: 1px solid rgba(79,110,247,0.12);
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
      background: linear-gradient(160deg, rgba(13, 20, 36, 0.34) 0%, rgba(10, 16, 32, 0.38) 100%);
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

    .lp-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      z-index: 2;
    }

    .lp-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 56px;
    }
    .logo-ring {
      width: 46px;
      height: 46px;
      background: rgba(79,110,247,0.15);
      border: 1px solid rgba(79,110,247,0.25);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      backdrop-filter: blur(8px);
    }
    .logo-name {
      display: block;
      font-family: 'Space Grotesk', 'Inter', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: #f0f4ff;
      letter-spacing: -0.3px;
      text-shadow: 0 2px 20px rgba(0,0,0,0.3);
    }
    .logo-sub {
      display: block;
      font-size: 10px;
      color: rgba(252, 252, 252, 0.88);
      letter-spacing: 0.04em;
      margin-top: 1px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .lp-hero { margin-bottom: auto; }
    .lp-headline {
      font-family: 'Space Grotesk', 'Inter', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: #f0f4ff;
      line-height: 1.05;
      letter-spacing: -1.5px;
      margin-bottom: 16px;
      text-shadow: 0 4px 30px rgba(0,0,0,0.4);
    }
    .lp-body {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .status-rail {
      margin: 40px 0 32px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .rail-item { display: flex; align-items: center; gap: 10px; }
    .rail-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgba(79,110,247,0.25);
      flex-shrink: 0;
      transition: background 0.3s;
    }
    .rail-dot.active {
      background: #4f6ef7;
      box-shadow: 0 0 6px rgba(79,110,247,0.7);
      animation: pulse-dot 2.5s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 6px rgba(79,110,247,0.7); }
      50%       { box-shadow: 0 0 12px rgba(79,110,247,0.4); }
    }
    .rail-label {
      font-size: 12px;
      color: rgb(160, 180, 220);
      letter-spacing: 0.02em;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .role-desc {
    font-size: 10px;
    color: #7c91af;
    font-weight: 400;
}
    .lp-clock {
      font-family: 'Space Mono', 'Courier New', monospace;
      font-size: 12px;
      color: rgb(255, 255, 255);
      letter-spacing: 0.1em;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
.loading-hint {
  font-size: 12px;
  color: #4f6ef7;
  margin-top: 4px;
  font-style: italic;
}
.error-hint {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}
    /* ─── RIGHT PANEL ─── */
    .right-panel {
      flex: 1;
      background: #ffffff;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .right-panel::-webkit-scrollbar { width: 4px; }
    .right-panel::-webkit-scrollbar-thumb { background: rgba(79,110,247,0.2); border-radius: 2px; }

    .form-wrap {
      width: 90%;
      margin: 0 auto;
      padding: 25px 24px 30px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
    }

    .form-head { 
      text-align: center;
      margin-bottom: 24px; 
    }
    .form-title {
      font-family: 'Space Grotesk', 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .form-sub {
      font-size: 13px;
      color: #64748b;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .alert-ico {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 700;
      font-size: 12px;
    }
    .err-ico { background: rgba(239,68,68,0.1); color: #ef4444; }
    .ok-ico  { background: rgba(34,197,94,0.1); color: #22c55e; }
    .alert-title { font-weight: 600; color: #0f172a; margin-bottom: 2px; }
    .alert-msg   { font-size: 12px; color: #64748b; }
    .a-err { background: #fef2f2; border: 1px solid #fecaca; }
    .a-ok  { background: #f0fdf4; border: 1px solid #bbf7d0; }

    /* ─── BRANCH SELECTION ─── */
    .branch-selection {
      padding: 20px 0;
      max-width: 380px;
      margin: 0 auto;
    }
    .branch-prompt {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 16px;
      text-align: center;
    }

    .login-link-bottom {
      margin-top: 24px;
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .login-text {
      font-size: 12px;
      color: #64748b;
    }
    .login-link-btn {
      background: none;
      border: none;
      color: #4f6ef7;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-family: 'Inter', sans-serif;
      transition: color 0.15s;
    }
    .login-link-btn:hover {
      color: #3b57d9;
      text-decoration: underline;
    }

    /* ─── FORM ─── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field.full-width {
      grid-column: 1 / -1;
    }

    .lbl {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      letter-spacing: 0.02em;
    }
    .req { color: #4f6ef7; }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      border-radius: 6px;
      border: 1.5px solid #0c1014;
    }
    .input-wrap.inp-err .inp { border-color: #fca5a5; background: #fff5f5; }
    .input-wrap.inp-ok  .inp { border-color: #86efac; background: #f0fdf4; }

    .field-ico {
      position: absolute;
      left: 10px;
      color: #7b7d81;
      font-size: 13px;
      display: flex;
      pointer-events: none;
      z-index: 1;
    }

    .inp {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      color: #0f172a;
      padding: 8px 10px 8px 32px;
      font-size: 12px;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      -webkit-appearance: none;
    }
    .inp::placeholder { color: #b0bec5; font-size: 12px; }
    .inp:focus {
      outline: none;
      border-color: #4f6ef7;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(79,110,247,0.08);
    }
    .inp:disabled { opacity: 0.4; cursor: not-allowed; background: #f1f5f9; }

    .select-arrow {
      position: absolute;
      right: 10px;
      color: #9ca3af;
      pointer-events: none;
      font-size: 10px;
    }

    .eye-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      display: flex;
      align-items: center;
      padding: 4px;
      transition: color 0.15s;
      z-index: 1;
    }
    .eye-btn:hover { color: #4f6ef7; }

    .field-err {
      font-size: 12px;
      color: #ef4444;
      margin-top: 2px;
      display: block;
    }

    .key-inp { font-family: 'Space Mono', 'Courier New', monospace; letter-spacing: 0.06em; }
    .key-status {
      position: absolute;
      right: 10px;
      display: flex;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
    }
    .key-status.ok  { color: #22c55e; }
    .key-status.err { color: #ef4444; }

    /* ─── BRANCH HEADER ─── */
    .branch-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 16px;
      grid-column: 1 / -1;
    }
    .branch-label {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .change-branch-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: #4f6ef7;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .change-branch-btn:hover {
      background: rgba(79,110,247,0.08);
    }

    /* ─── TERMS ─── */
    .terms-box {
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .terms-check {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
    }
    .terms-check input[type="checkbox"] {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
      margin-top: 2px;
      cursor: pointer;
      accent-color: #4f6ef7;
    }
    .check-label {
      font-size: 12px;
      color: #374151;
      line-height: 1.4;
    }
    .terms-link {
      background: none;
      border: none;
      color: #4f6ef7;
      text-decoration: underline;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      padding: 0 2px;
      font-family: 'Inter', sans-serif;
    }
    .terms-link:hover { color: #3b57d9; }

    /* ─── BUTTON ROW ─── */
    .button-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 4px;
    }

    .login-link-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .submit-btn {
      background: #4f6ef7;
      border: none;
      border-radius: 6px;
      color: #ffffff;
      padding: 9px 24px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Space Grotesk', 'Inter', sans-serif;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(79,110,247,0.3);
      min-width: 140px;
    }
    .submit-btn:hover:not(:disabled) {
      background: #3b57d9;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(79,110,247,0.4);
    }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── MODALS ─── */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(7,9,15,0.6);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 4000;
      animation: bkdIn 0.2s ease;
    }
    @keyframes bkdIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #ffffff;
      border-radius: 12px;
      width: 90%;
      max-width: 520px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      animation: modalIn 0.25s cubic-bezier(.16,1,.3,1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: none; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #0f172a;
      border-radius: 12px 12px 0 0;
    }
    .modal-header-inner { display: flex; align-items: center; gap: 10px; }
    .modal-icon { font-size: 20px; }
    .modal-header h3 {
      font-family: 'Space Grotesk','Inter',sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #f0f4ff;
      margin: 0;
    }
    .modal-close-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: background 0.15s;
    }
    .modal-close-btn:hover { background: rgba(239,68,68,0.5); color: white; }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      font-size: 12px;
      color: #374151;
      line-height: 1.6;
    }
    .modal-body::-webkit-scrollbar { width: 4px; }
    .modal-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
    .modal-body h4 { color: #0f172a; font-weight: 700; font-size: 13px; margin: 14px 0 4px; }
    .modal-body h4:first-child { margin-top: 0; }
    .modal-body p { margin-bottom: 6px; }

    .privacy-badge {
      display: flex;
      justify-content: space-between;
      background: rgba(79,110,247,0.06);
      border: 1px solid rgba(79,110,247,0.15);
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #4f6ef7;
    }
    .consent-notice {
      background: #fffbeb;
      border-left: 3px solid #f5a623;
      padding: 10px 12px;
      margin-top: 12px;
      font-size: 12px;
      line-height: 1.6;
      border-radius: 0 4px 4px 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 14px 20px;
      border-top: 1px solid #f1f5f9;
    }
    .modal-cancel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: all 0.15s;
    }
    .modal-cancel:hover { background: #f1f5f9; }
    .modal-accept {
      background: #4f6ef7;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      font-family: 'Space Grotesk','Inter', sans-serif;
      transition: background 0.15s;
    }
    .modal-accept:hover { background: #3b57d9; }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 768px) {
      .shell { flex-direction: column; }
      .left-panel {
        width: 100%;
        height: 260px;
        min-height: 260px;
        padding: 24px 24px 20px;
        border-right: none;
        border-bottom: 1px solid rgba(79,110,247,0.12);
      }
      .lp-inner { flex-direction: row; align-items: center; justify-content: space-between; width: 100%; }
      .lp-hero, .status-rail, .lp-clock { display: none; }
      .lp-logo { margin-bottom: 0; }
      .form-wrap { padding: 20px 20px 32px; max-width: 100%; }
      .form-grid { grid-template-columns: 1fr; }
      .button-row { flex-direction: column; align-items: stretch; }
      .login-link-wrapper { justify-content: center; }
      .submit-btn { width: 100%; }
      .branch-header { flex-wrap: wrap; gap: 8px; }
      .branch-selection { max-width: 100%; }
    }

    @media (max-width: 480px) {
      .left-panel { height: 200px; min-height: 200px; padding: 16px; }
      .form-wrap { padding: 16px 16px 24px; }
    }
  `]
})
export class SignupPageComponent implements OnInit, OnDestroy {
  // =============================================
  // BRANCH, DEPARTMENT & ROLE DATA
  // =============================================
  branches: any[] = [];
  branchDepartments: any[] = [];
  departmentRoles: any[] = [];
  branchesLoaded = false;
  selectedBranchId: string = '';
  selectedDepartmentId: string = '';

  // =============================================
  // REGISTRATION PROPERTIES
  // =============================================
  agreeToTerms = false;
  showTermsModal = false;
  showPrivacyModal = false;
  termsAccepted = false;
  privacyAccepted = false;

  reg = {
    username: '', fullname: '', email: '',
    department: '', role: '', password: '',
    confirmPassword: '', avatar_color: '#4f6ef7', registrationKey: ''
  };

  showRegPw     = false;
  signupLoading = false;
  signupError   = '';
  signupSuccess = false;
  regKeyValid   = false;
  regKeyInvalid = false;
  keyCheckLoading = false;

  currentTime = '';
  tickerIndex = 0;
  uptimeSegs  = Array.from({ length: 24 }, (_, i) => i !== 7);

  readonly avatarColors = [
    '#4f6ef7', '#f5a623', '#ef4444', '#22c55e',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
  ];

  readonly tickerMsgs = [
    'Login attempts are monitored and logged',
    'Unauthorized access violates company policy',
    'Report security incidents to IT immediately',
    'Never share your credentials with anyone',
  ];

  private keyCheckTimeout: any;
  private clockInterval: any;
  private tickerInterval: any;

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
    this.loadBranches();
  }

  ngOnDestroy() {
    if (this.keyCheckTimeout) clearTimeout(this.keyCheckTimeout);
    clearInterval(this.clockInterval);
    clearInterval(this.tickerInterval);
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  // =============================================
  // NAVIGATION
  // =============================================
  goToLogin() {
    this.router.navigate(['/login']);
  }

  resetBranchSelection() {
    this.selectedBranchId = '';
    this.selectedDepartmentId = '';
    this.branchDepartments = [];
    this.departmentRoles = [];
    this.reg.role = '';
  }

  // =============================================
  // BRANCH METHODS
  // =============================================
  loadBranches() {
    this.branchesLoaded = false;
    
    const timeoutId = setTimeout(() => {
      if (!this.branchesLoaded) {
        console.warn('⚠️ Branch loading timeout');
        this.branchesLoaded = true;
      }
    }, 5000);
    
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (data) => {
        clearTimeout(timeoutId);
        console.log('✅ Branches loaded:', data);
        this.branches = Array.isArray(data) ? data : [];
        this.branchesLoaded = true;
        
        if (this.branches.length === 1) {
          this.selectedBranchId = String(this.branches[0].id);
          this.onBranchChange();
        }
      },
      error: (err) => {
        clearTimeout(timeoutId);
        console.error('❌ Failed to load branches:', err);
        this.branches = [];
        this.branchesLoaded = true;
      }
    });
  }

  getBranchName(branchId: any): string {
    if (!branchId) return '';
    const id = typeof branchId === 'string' ? parseInt(branchId, 10) : branchId;
    const branch = this.branches.find(b => b.id === id);
    return branch ? branch.name : '';
  }

  getBranchCompany(branchId: any): string {
    if (!branchId) return '';
    const id = typeof branchId === 'string' ? parseInt(branchId, 10) : branchId;
    const branch = this.branches.find(b => b.id === id);
    return branch?.company_name || '';
  }

  // =============================================
  // BRANCH CHANGE
  // =============================================
  onBranchChange() {
    this.selectedDepartmentId = '';
    this.branchDepartments = [];
    this.departmentRoles = [];
    this.reg.role = '';
    if (!this.selectedBranchId) return;
    const branchId = parseInt(this.selectedBranchId, 10);
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches/${branchId}/departments`).subscribe({
      next: (data) => { 
        this.branchDepartments = Array.isArray(data) ? data : []; 
        console.log('✅ Departments loaded:', this.branchDepartments);
      },
      error: (err) => { 
        console.error('❌ Failed to load departments:', err);
        this.branchDepartments = []; 
      }
    });
  }

  // =============================================
  // DEPARTMENT CHANGE
  // =============================================
  onDepartmentChange() {
    this.departmentRoles = [];
    this.reg.role = '';
    if (!this.selectedDepartmentId) return;
    const deptId = parseInt(this.selectedDepartmentId, 10);
    this.http.get<any[]>(`${environment.apiUrl}/api/public/departments/${deptId}/roles`).subscribe({
      next: (data) => {
        console.log('✅ Roles loaded:', data);
        this.departmentRoles = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('❌ Failed to load roles:', err);
        this.departmentRoles = [];
      }
    });
  }

  // =============================================
  // REGISTRATION KEY VALIDATION
  // =============================================
  validateRegKey() {
    const key = this.reg.registrationKey;
    if (!key || key.length === 0) {
      this.regKeyValid = false;
      this.regKeyInvalid = false;
      return;
    }
    if (this.keyCheckTimeout) clearTimeout(this.keyCheckTimeout);
    this.keyCheckLoading = true;
    this.keyCheckTimeout = setTimeout(() => this.checkKeyWithServer(key), 500);
  }

  checkKeyWithServer(key: string) {
    this.http.post<any>(`${environment.apiUrl}/api/auth/validate-key`, { key_code: key }).subscribe({
      next: (response) => {
        this.keyCheckLoading = false;
        if (response.valid) {
          this.regKeyValid = true;
          this.regKeyInvalid = false;
          if (!this.selectedBranchId && response.branch_id) {
            this.selectedBranchId = String(response.branch_id);
            this.onBranchChange();
          }
        } else {
          this.regKeyValid = false;
          this.regKeyInvalid = true;
        }
      },
      error: (err) => {
        this.keyCheckLoading = false;
        this.regKeyValid = false;
        this.regKeyInvalid = true;
        console.error('❌ Key validation error:', err);
      }
    });
  }

  // =============================================
  // TERMS & PRIVACY
  // =============================================
  openTermsModal()   { this.showTermsModal = true; }
  closeTermsModal()  { this.showTermsModal = false; }
  openPrivacyModal() { this.showPrivacyModal = true; }
  closePrivacyModal(){ this.showPrivacyModal = false; }

  acceptTerms() {
    this.termsAccepted = true;
    this.agreeToTerms = this.termsAccepted && this.privacyAccepted;
    this.closeTermsModal();
  }

  acceptPrivacy() {
    this.privacyAccepted = true;
    this.agreeToTerms = this.termsAccepted && this.privacyAccepted;
    this.closePrivacyModal();
  }

  // =============================================
  // SIGNUP
  // =============================================
  canSubmitSignup(): boolean {
    return !!(
      this.selectedBranchId &&
      this.selectedDepartmentId &&
      this.reg.role &&
      this.reg.username &&
      this.reg.fullname &&
      this.reg.email &&
      this.reg.password &&
      this.reg.password.length >= 5 &&
      this.reg.password === this.reg.confirmPassword &&
      this.regKeyValid &&
      this.agreeToTerms
    );
  }

  onSignup() {
    this.signupError = '';
    this.signupSuccess = false;
    if (this.signupLoading) return;

    // Validation
    if (!this.selectedBranchId) { 
      this.signupError = 'Please select a branch.'; 
      return; 
    }
    if (!this.selectedDepartmentId) { 
      this.signupError = 'Please select a department.'; 
      return; 
    }
    if (!this.reg.role) { 
      this.signupError = 'Please select a role.'; 
      return; 
    }
    if (!this.reg.username || !this.reg.fullname || !this.reg.email || !this.reg.password || !this.reg.confirmPassword) {
      this.signupError = 'All required fields must be filled.'; 
      return;
    }
    if (this.reg.password.length < 5) { 
      this.signupError = 'Password must be at least 5 characters.'; 
      return; 
    }
    if (this.reg.password !== this.reg.confirmPassword) { 
      this.signupError = 'Passwords do not match.'; 
      return; 
    }
    if (!this.reg.registrationKey) { 
      this.signupError = 'Registration key is required.'; 
      return; 
    }
    if (!this.regKeyValid) { 
      this.signupError = 'Invalid registration key.'; 
      return; 
    }

    this.signupLoading = true;
    
    // Find department and branch names
    const dept = this.branchDepartments.find(d => d.id === parseInt(this.selectedDepartmentId, 10));
    const branch = this.branches.find(b => b.id === parseInt(this.selectedBranchId, 10));
    
    const payload = {
      username: this.reg.username,
      fullname: this.reg.fullname,
      email: this.reg.email,
      password: this.reg.password,
      role: this.reg.role,
      department: dept?.name || '',
      department_id: parseInt(this.selectedDepartmentId, 10),
      branch_id: parseInt(this.selectedBranchId, 10),
      avatar_color: this.reg.avatar_color || '#4f6ef7',
      registrationKey: this.reg.registrationKey
    };

    console.log('📤 Registration payload:', payload);

    this.authService.signup(payload).subscribe({
      next: () => {
        this.signupSuccess = true;
        this.signupLoading = false;
        
        // Reset form fields
        this.reg = { 
          username: '', fullname: '', email: '', 
          department: '', role: '', password: '', 
          confirmPassword: '', avatar_color: '#4f6ef7', registrationKey: '' 
        };
        this.selectedDepartmentId = '';
        this.branchDepartments = [];
        this.departmentRoles = [];
        this.regKeyValid = false;
        this.regKeyInvalid = false;
        
        setTimeout(() => { 
          this.goToLogin(); 
          this.signupSuccess = false;
          this.selectedBranchId = '';
        }, 2000);
      },
      error: (err) => {
        this.signupLoading = false;
        console.error('❌ Registration error:', err);
        if (err.status === 403) { 
          this.signupError = err.error?.message || 'Invalid registration key.'; 
        } else if (err.status === 409) { 
          this.signupError = 'Username or email already exists.'; 
        } else { 
          this.signupError = err.error?.message || 'Server error. Please try again later.'; 
        }
      }
    });
  }
}