import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────
interface Camera {
  id: number;
  location: string;
  ip_address: string;
  rtsp_url?: string;
  type: string;
  resolution: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  last_maintained?: string;
  installed_date?: string;
  dvr_id?: number;
  notes?: string;
  recording?: boolean;
  frame_rate?: number;
  storage_days?: number;
}

interface DVR {
  id: number;
  name: string;
  ip_address: string;
  model: string;
  channels: number;
  used_channels: number;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  installed_date?: string;
  firmware_version?: string;
  storage_tb?: number;
  notes?: string;
}

interface Charger {
  id: number;
  label: string;
  ip_address?: string;
  device_type: string;
  connected_to: string;
  watts?: number;
  status: 'ok' | 'faulty' | 'replaced';
  installed_date?: string;
  last_checked?: string;
  notes?: string;
}

interface ChangeLog {
  id: number;
  date: string;
  type: 'camera_added' | 'camera_replaced' | 'dvr_added' | 'dvr_replaced' | 'charger_added' | 'charger_replaced' | 'maintenance' | 'other';
  item: string;
  description: string;
  performed_by: string;
  before_value?: string;
  after_value?: string;
}

interface VideoFeed {
  cameraId: number;
  streamUrl: string;
  active: boolean;
  fullscreen: boolean;
  error: boolean;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
@Component({
  selector: 'app-cctv-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ═══════════════════════════════════════════════════════════════════
     CCTV EDPtech DASHBOARD
═══════════════════════════════════════════════════════════════════ -->
<!-- AUTH GATE - Show login form if not authenticated -->
<div class="cctv-auth-gate" *ngIf="!isAuthenticated">
  <div class="cctv-auth-card">
    <div class="cctv-auth-header">
      <span class="cctv-auth-icon">📹</span>
      <h2>CCTV System Access</h2>
      <p class="cctv-auth-sub">This area contains live camera feeds and surveillance system management. Please verify your identity to continue.</p>
    </div>
    
    <div class="cctv-auth-user-info" *ngIf="currentUser">
      <div class="cctv-user-avatar" [style.background]="currentUser.avatar_color || '#0a246a'">
        <img *ngIf="currentUser.photo_url" [src]="apiUrl + currentUser.photo_url" alt="User" class="cctv-user-photo">
        <span *ngIf="!currentUser.photo_url">{{ currentUser.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
      </div>
      <div class="cctv-user-details">
        <strong>{{ currentUser.fullname }}</strong>
        <span>{{ currentUser.role | uppercase }} · {{ currentUser.department }}</span>
      </div>
    </div>

    <div class="cctv-auth-form">
      <div class="cctv-input-group">
        <label>Enter your password to access CCTV System</label>
        <div class="cctv-password-wrapper">
          <input 
            [type]="showPassword ? 'text' : 'password'"
            [(ngModel)]="authPassword" 
            (keyup.enter)="verifyCCTVAccess()"
            class="cctv-auth-input" 
            placeholder="••••••••"
            [disabled]="isVerifying">
          <button class="cctv-toggle-password" (click)="showPassword = !showPassword" type="button">
            {{ showPassword ? '🙈' : '👁' }}
          </button>
        </div>
      </div>
      
      <div class="cctv-auth-error" *ngIf="authError">
        <span class="error-icon">⚠️</span>
        <span>{{ authError }}</span>
      </div>

      <div class="cctv-auth-actions">
        <button class="cctv-auth-btn back" (click)="goBackToDashboard()">
          <span>🏠</span> Back to Dashboard
        </button>
        <button class="cctv-auth-btn primary" (click)="verifyCCTVAccess()" [disabled]="isVerifying || !authPassword">
          <span *ngIf="!isVerifying">🔓 Verify & Access CCTV</span>
          <span *ngIf="isVerifying">
            <span class="mini-spinner"></span> Verifying...
          </span>
        </button>
      </div>
    </div>
    
    <div class="cctv-auth-footer">
      <span>🔒 Secure Access Required</span>
      <span>EDPtech CCTV System v1.0</span>
    </div>
  </div>
</div>
<div class="nexus-shell" [class.light]="!darkMode" *ngIf="isAuthenticated">
<!-- ── TOP NAVIGATION BAR ────────────────────────── -->
  <header class="cctv-navbar">
    <div class="nav-left">
      <div class="nav-brand">
        <span class="brand-icon">◈</span>
        <span class="brand-name">EDPtech CCTV</span>
      </div>
    </div>
    <div class="nav-center">
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span>LIVE MONITORING</span>
      </div>
    </div>
    <div class="nav-right">
      <!-- Replace the emoji with explicit text labels -->
<button class="icon-btn" (click)="darkMode=!darkMode" title="Toggle theme">
  {{ darkMode ? '☀️' : '🌙' }}
</button>
      <button class="nav-icon-btn" (click)="sidebarCollapsed=!sidebarCollapsed" title="Toggle sidebar">
        ☰
      </button>
    </div>
  </header>

  <!-- ── MAIN CONTENT WRAPPER ────────────────────── -->
  <div class="cctv-main-wrapper">
  <!-- ── SIDEBAR ────────────────────────────────────────── -->
  <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
    <div class="sidebar-brand">
      <span class="brand-icon">◈</span>
      <span class="brand-name">EDPtech CCTV</span>
    </div>
    <nav class="sidebar-nav">
      <button class="nav-item" [class.active]="activeTab==='monitor'"   (click)="activeTab='monitor'">
        <span class="nav-icon">⬡</span><span class="nav-label">Live Monitor</span>
      </button>
      <button class="nav-item" [class.active]="activeTab==='cameras'"   (click)="activeTab='cameras'">
        <span class="nav-icon">◎</span><span class="nav-label">Cameras</span>
        <span class="nav-badge">{{cameras.length}}</span>
      </button>
      <button class="nav-item" [class.active]="activeTab==='dvr'"       (click)="activeTab='dvr'">
        <span class="nav-icon">▣</span><span class="nav-label">DVR Units</span>
        <span class="nav-badge">{{dvrs.length}}</span>
      </button>
      <button class="nav-item" [class.active]="activeTab==='chargers'"  (click)="activeTab='chargers'">
        <span class="nav-icon">⚡</span><span class="nav-label">Power / Chargers</span>
        <span class="nav-badge">{{chargers.length}}</span>
      </button>
      <button class="nav-item" [class.active]="activeTab==='changelog'" (click)="activeTab='changelog'">
        <span class="nav-icon">◫</span><span class="nav-label">Change Log</span>
      </button>
       <button class="nav-item" (click)="goBackToDashboard()" title="Back to Dashboard">
        <span class="nav-icon">🏠</span>
        <span class="back-text">Back to Dashboard</span>
      </button>
    </nav>
    <div class="sidebar-footer">
      <button class="icon-btn" (click)="darkMode=!darkMode" title="Toggle theme">{{darkMode?'☀':'🌙'}}</button>
      <button class="icon-btn" (click)="sidebarCollapsed=!sidebarCollapsed" title="Collapse">◁</button>
    </div>
  </aside>

  <!-- ── MAIN ───────────────────────────────────────────── -->
  <main class="main-area">

    <!-- ╔══ TOPBAR ══╗ -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="topbar-title">{{ tabTitle }}</div>
        <div class="topbar-breadcrumb">EDPtech CCTV › {{ tabTitle }}</div>
      </div>
      <div class="topbar-right">
        <div class="live-pulse"><span class="pulse-dot"></span>LIVE</div>
        <div class="clock">{{ now | date:'HH:mm:ss' }}</div>
        <div class="clock-date">{{ now | date:'MMM d, yyyy' }}</div>
      </div>
    </header>

    <!-- ╔══ OVERVIEW TILES ══╗ -->
    <div class="overview-tiles" *ngIf="activeTab==='monitor' || activeTab==='cameras'">
      <div class="tile tile-total">
        <div class="tile-icon">◎</div>
        <div class="tile-body">
          <div class="tile-val">{{cameras.length}}</div>
          <div class="tile-lbl">Total Cameras</div>
        </div>
      </div>
      <div class="tile tile-active">
        <div class="tile-icon">●</div>
        <div class="tile-body">
          <div class="tile-val">{{getCount(cameras,'status','active')}}</div>
          <div class="tile-lbl">Active</div>
        </div>
      </div>
      <div class="tile tile-offline">
        <div class="tile-icon">○</div>
        <div class="tile-body">
          <div class="tile-val">{{getCount(cameras,'status','offline') + getCount(cameras,'status','inactive')}}</div>
          <div class="tile-lbl">Offline</div>
        </div>
      </div>
      <div class="tile tile-maint">
        <div class="tile-icon">⚙</div>
        <div class="tile-body">
          <div class="tile-val">{{getCount(cameras,'status','maintenance')}}</div>
          <div class="tile-lbl">Maintenance</div>
        </div>
      </div>
      <div class="tile tile-dvr">
        <div class="tile-icon">▣</div>
        <div class="tile-body">
          <div class="tile-val">{{dvrs.length}}</div>
          <div class="tile-lbl">DVR Units</div>
        </div>
      </div>
      <div class="tile tile-charger">
        <div class="tile-icon">⚡</div>
        <div class="tile-body">
          <div class="tile-val">{{getCount(chargers,'status','faulty')}}</div>
          <div class="tile-lbl">Faulty Power</div>
        </div>
      </div>
    </div>

    <!-- ╔══════════════════════════════════════════════╗
         ║  TAB: LIVE MONITOR                          ║
         ╚══════════════════════════════════════════════╝ -->
    <section class="tab-panel" *ngIf="activeTab==='monitor'">

      <!-- Grid controls -->
      <div class="monitor-toolbar">
        <div class="toolbar-group">
          <span class="toolbar-label">Grid Layout</span>
          <button class="grid-btn" [class.sel]="gridLayout===1" (click)="gridLayout=1">1×1</button>
          <button class="grid-btn" [class.sel]="gridLayout===2" (click)="gridLayout=2">2×2</button>
          <button class="grid-btn" [class.sel]="gridLayout===3" (click)="gridLayout=3">3×3</button>
          <button class="grid-btn" [class.sel]="gridLayout===4" (click)="gridLayout=4">4×4</button>
        </div>
        <div class="toolbar-group">
          <span class="toolbar-label">Filter</span>
          <select class="tb-select" [(ngModel)]="monitorFilter" (change)="applyMonitorFilter()">
            <option value="all">All Cameras</option>
            <option value="active">Active Only</option>
            <option value="offline">Offline Only</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div class="toolbar-group" style="margin-left:auto">
          <button class="tb-action-btn" (click)="refreshAllFeeds()">↺ Refresh Feeds</button>
          <button class="tb-action-btn" (click)="checkCameraHealth()">🩺 Health Check</button>
          <button class="tb-action-btn warn" (click)="takeAllSnapshot()">📷 Snapshot All</button>
        </div>
      </div>

      <!-- Video Grid -->
      <div class="video-grid" [class.grid-1]="gridLayout===1" [class.grid-2]="gridLayout===2"
           [class.grid-3]="gridLayout===3" [class.grid-4]="gridLayout===4">
        <div class="video-cell" *ngFor="let cam of monitorCameras"
             [class.fullscreen-cell]="fullscreenCam?.id===cam.id">

          <!-- Feed header -->
          <div class="feed-header">
            <div class="feed-id">CAM-{{cam.id | number:'2.0-0'}}</div>
            <div class="feed-location">{{cam.location}}</div>
            <div class="feed-status" [class]="'fs-'+cam.status">
              <span class="fs-dot"></span>{{cam.status}}
            </div>
          </div>

          <!-- Video / placeholder area -->
          <div class="feed-viewport" (dblclick)="toggleFullscreen(cam)">
            <ng-container *ngIf="cam.status==='active'; else offlineScreen">
              <!-- MJPEG img stream — works for most IP cameras on LAN -->
              <img *ngIf="cam.rtsp_url || cam.ip_address"
                   [src]="getMjpegUrl(cam)"
                   class="feed-img"
                   (error)="onFeedError(cam)"
                   [class.feed-error-img]="feedErrors[cam.id]"
                   alt="Feed {{cam.id}}">
              <!-- Overlay error message -->
              <div class="feed-error-overlay" *ngIf="feedErrors[cam.id]">
                <span>⚠ Stream unavailable</span>
                <small>{{getMjpegUrl(cam)}}</small>
                <button (click)="retryFeed(cam)">Retry</button>
              </div>
              <!-- Live label when no error -->
              <div class="feed-live-tag" *ngIf="!feedErrors[cam.id]">● REC</div>
            </ng-container>
            <ng-template #offlineScreen>
              <div class="feed-offline-screen">
                <span class="offline-icon">○</span>
                <span>{{cam.status | uppercase}}</span>
                <small>{{cam.ip_address}}</small>
              </div>
            </ng-template>

            <!-- Fullscreen toggle badge -->
            <button class="fs-toggle-btn" (click)="toggleFullscreen(cam)" title="Fullscreen">
              {{fullscreenCam?.id===cam.id ? '⤡' : '⤢'}}
            </button>
          </div>

          <!-- Feed footer -->
          <div class="feed-footer">
            <span>{{cam.resolution || '—'}}</span>
            <span>{{cam.type || '—'}}</span>
            <span>{{cam.ip_address}}</span>
            <button class="feed-action" (click)="openCameraDetail(cam)">Detail ›</button>
          </div>
        </div>

        <div class="no-cameras" *ngIf="monitorCameras.length===0">
          <span>No cameras match the current filter.</span>
        </div>
      </div>

      <!-- Fullscreen overlay -->
      <div class="fullscreen-overlay" *ngIf="fullscreenCam" (click)="closeFullscreen()">
        <div class="fullscreen-panel" (click)="$event.stopPropagation()">
          <div class="fs-panel-header">
            <span class="fs-panel-id">CAM-{{fullscreenCam.id | number:'2.0-0'}}</span>
            <span class="fs-panel-loc">{{fullscreenCam.location}}</span>
            <span class="fs-panel-ip">{{fullscreenCam.ip_address}}</span>
            <span class="feed-status" [class]="'fs-'+fullscreenCam.status">
              <span class="fs-dot"></span>{{fullscreenCam.status}}
            </span>
            <button class="fs-close" (click)="closeFullscreen()">✕ Close</button>
          </div>
          <div class="fs-panel-video">
            <img *ngIf="fullscreenCam.status==='active'"
                 [src]="getMjpegUrl(fullscreenCam)"
                 class="fs-video-img"
                 (error)="onFeedError(fullscreenCam)"
                 alt="Fullscreen Feed">
            <div class="feed-offline-screen" *ngIf="fullscreenCam.status!=='active'">
              <span class="offline-icon">○</span>
              <span>{{fullscreenCam.status | uppercase}}</span>
            </div>
          </div>
          <div class="fs-panel-meta">
            <div class="fs-meta-grid">
              <div><label>Type</label><span>{{fullscreenCam.type}}</span></div>
              <div><label>Resolution</label><span>{{fullscreenCam.resolution}}</span></div>
              <div><label>Frame Rate</label><span>{{fullscreenCam.frame_rate || '—'}} fps</span></div>
              <div><label>Storage</label><span>{{fullscreenCam.storage_days || '—'}} days</span></div>
              <div><label>Installed</label><span>{{fullscreenCam.installed_date | date:'MMM d, y'}}</span></div>
              <div><label>Last Maint.</label><span>{{fullscreenCam.last_maintained | date:'MMM d, y'}}</span></div>
            </div>
            <div class="fs-panel-actions">
              <button class="fs-act-btn" (click)="editCamera(fullscreenCam); closeFullscreen()">✏ Edit</button>
              <button class="fs-act-btn warn" (click)="logChange('camera_replaced', fullscreenCam.location, 'Camera replaced'); closeFullscreen()">🔄 Log Replacement</button>
              <button class="fs-act-btn maint" (click)="markMaintenance(fullscreenCam); closeFullscreen()">⚙ Mark Maintenance</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ╔══════════════════════════════════════════════╗
         ║  TAB: CAMERAS                               ║
         ╚══════════════════════════════════════════════╝ -->
    <section class="tab-panel" *ngIf="activeTab==='cameras'">
      <div class="panel-toolbar">
        <input class="search-input" [(ngModel)]="camSearch" (input)="filterCams()"
               placeholder="Search location, IP, type…">
        <select class="tb-select" [(ngModel)]="camStatusFilter" (change)="filterCams()">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
        </select>
        <button class="add-btn" (click)="openCameraModal()">➕ Add Camera</button>
        <span class="result-count">{{filteredCams.length}} result(s)</span>
      </div>

      <div class="card-table-wrap">
        <table class="nx-table">
          <thead>
            <tr>
              <th>ID</th><th>Location</th><th>IP Address</th><th>RTSP / MJPEG URL</th>
              <th>Type</th><th>Resolution</th><th>FPS</th><th>Status</th>
              <th>Installed</th><th>Last Maintained</th><th>DVR</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cam of filteredCams" class="nx-row">
              <td class="td-id">{{cam.id}}</td>
              <td><strong>{{cam.location}}</strong></td>
              <td><code>{{cam.ip_address}}</code></td>
              <td><code class="url-td">{{cam.rtsp_url || getMjpegUrl(cam)}}</code></td>
              <td>{{cam.type || '—'}}</td>
              <td>{{cam.resolution || '—'}}</td>
              <td>{{cam.frame_rate || '—'}}</td>
              <td><span class="nx-badge" [class]="'badge-'+cam.status">{{cam.status}}</span></td>
              <td>{{cam.installed_date | date:'MMM d, y'}}</td>
              <td>{{cam.last_maintained | date:'MMM d, y'}}</td>
              <td>{{getDvrName(cam.dvr_id)}}</td>
              <td class="td-actions">
                <button class="act" title="View Live" (click)="quickView(cam)">▶</button>
                <button class="act" title="Edit" (click)="editCamera(cam)">✏</button>
                <button class="act" title="Maintenance" (click)="markMaintenance(cam)">⚙</button>
                <button class="act del" title="Delete" (click)="deleteCamera(cam)">✕</button>
              </td>
            </tr>
            <tr *ngIf="filteredCams.length===0">
              <td colspan="12" class="empty-row">No cameras found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ╔══════════════════════════════════════════════╗
         ║  TAB: DVR                                   ║
         ╚══════════════════════════════════════════════╝ -->
    <section class="tab-panel" *ngIf="activeTab==='dvr'">
      <div class="panel-toolbar">
        <input class="search-input" [(ngModel)]="dvrSearch" (input)="filterDvrs()"
               placeholder="Search DVR name, IP, location…">
        <button class="add-btn" (click)="openDvrModal()">➕ Add DVR</button>
        <span class="result-count">{{filteredDvrs.length}} unit(s)</span>
      </div>

      <div class="dvr-cards">
        <div class="dvr-card" *ngFor="let dvr of filteredDvrs" [class]="'dvr-'+dvr.status">
          <div class="dvr-card-header">
            <div class="dvr-card-icon">▣</div>
            <div class="dvr-card-title">
              <strong>{{dvr.name}}</strong>
              <span class="nx-badge" [class]="'badge-'+dvr.status">{{dvr.status}}</span>
            </div>
            <div class="dvr-card-actions">
              <button class="act" (click)="editDvr(dvr)" title="Edit">✏</button>
              <button class="act" (click)="logChange('dvr_replaced', dvr.name, 'DVR replaced'); showToastMsg('Change logged','success')" title="Log Replacement">🔄</button>
              <button class="act del" (click)="deleteDvr(dvr)" title="Delete">✕</button>
            </div>
          </div>
          <div class="dvr-card-body">
            <div class="dvr-meta-row"><label>IP Address</label><code>{{dvr.ip_address}}</code></div>
            <div class="dvr-meta-row"><label>Model</label><span>{{dvr.model}}</span></div>
            <div class="dvr-meta-row"><label>Location</label><span>{{dvr.location}}</span></div>
            <div class="dvr-meta-row"><label>Firmware</label><span>{{dvr.firmware_version || '—'}}</span></div>
            <div class="dvr-meta-row"><label>Storage</label><span>{{dvr.storage_tb ? dvr.storage_tb + ' TB' : '—'}}</span></div>
            <div class="dvr-meta-row"><label>Installed</label><span>{{dvr.installed_date | date:'MMM d, y'}}</span></div>
          </div>
          <!-- Channel usage bar -->
          <div class="dvr-channel-bar">
            <div class="dcb-label">
              <span>Channels</span>
              <span>{{dvr.used_channels}} / {{dvr.channels}} used</span>
            </div>
            <div class="dcb-track">
              <div class="dcb-fill" [style.width.%]="(dvr.used_channels/dvr.channels)*100"></div>
            </div>
          </div>
          <div class="dvr-notes" *ngIf="dvr.notes">📝 {{dvr.notes}}</div>
        </div>
        <div class="no-cameras" *ngIf="filteredDvrs.length===0">No DVR units found.</div>
      </div>
    </section>

    <!-- ╔══════════════════════════════════════════════╗
         ║  TAB: CHARGERS / POWER                     ║
         ╚══════════════════════════════════════════════╝ -->
    <section class="tab-panel" *ngIf="activeTab==='chargers'">
      <div class="panel-toolbar">
        <input class="search-input" [(ngModel)]="chargerSearch" (input)="filterChargers()"
               placeholder="Search device, connected to…">
        <select class="tb-select" [(ngModel)]="chargerStatusFilter" (change)="filterChargers()">
          <option value="">All Statuses</option>
          <option value="ok">OK</option>
          <option value="faulty">Faulty</option>
          <option value="replaced">Replaced</option>
        </select>
        <button class="add-btn" (click)="openChargerModal()">➕ Add Charger/PSU</button>
        <span class="result-count">{{filteredChargers.length}} device(s)</span>
      </div>

      <!-- Summary row -->
      <div class="charger-summary">
        <div class="cs-tile ok">
          <span>{{getCount(chargers,'status','ok')}}</span>OK
        </div>
        <div class="cs-tile faulty">
          <span>{{getCount(chargers,'status','faulty')}}</span>Faulty
        </div>
        <div class="cs-tile replaced">
          <span>{{getCount(chargers,'status','replaced')}}</span>Replaced
        </div>
      </div>

      <div class="card-table-wrap">
        <table class="nx-table">
          <thead>
            <tr>
              <th>Label</th><th>Device Type</th><th>Connected To</th><th>Watts</th>
              <th>IP / Network</th><th>Status</th><th>Installed</th><th>Last Checked</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filteredChargers" class="nx-row">
              <td><strong>{{c.label}}</strong></td>
              <td>{{c.device_type}}</td>
              <td>{{c.connected_to}}</td>
              <td>{{c.watts ? c.watts + 'W' : '—'}}</td>
              <td><code>{{c.ip_address || '—'}}</code></td>
              <td><span class="nx-badge" [class]="'badge-charger-'+c.status">{{c.status}}</span></td>
              <td>{{c.installed_date | date:'MMM d, y'}}</td>
              <td>{{c.last_checked | date:'MMM d, y'}}</td>
              <td class="td-actions">
                <button class="act" title="Edit" (click)="editCharger(c)">✏</button>
                <button class="act" title="Log Replacement" (click)="logChange('charger_replaced', c.label, 'Charger/PSU replaced'); showToastMsg('Logged','success')">🔄</button>
                <button class="act del" title="Delete" (click)="deleteCharger(c)">✕</button>
              </td>
            </tr>
            <tr *ngIf="filteredChargers.length===0">
              <td colspan="9" class="empty-row">No power devices found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ╔══════════════════════════════════════════════╗
         ║  TAB: CHANGE LOG                            ║
         ╚══════════════════════════════════════════════╝ -->
    <section class="tab-panel" *ngIf="activeTab==='changelog'">
      <div class="panel-toolbar">
        <input class="search-input" [(ngModel)]="logSearch" (input)="filterLogs()"
               placeholder="Search item, description, user…">
        <select class="tb-select" [(ngModel)]="logTypeFilter" (change)="filterLogs()">
          <option value="">All Types</option>
          <option value="camera_added">Camera Added</option>
          <option value="camera_replaced">Camera Replaced</option>
          <option value="dvr_added">DVR Added</option>
          <option value="dvr_replaced">DVR Replaced</option>
          <option value="charger_added">Charger Added</option>
          <option value="charger_replaced">Charger Replaced</option>
          <option value="maintenance">Maintenance</option>
          <option value="other">Other</option>
        </select>
        <button class="add-btn" (click)="openLogModal()">➕ Add Entry</button>
        <span class="result-count">{{filteredLogs.length}} entries</span>
      </div>

      <div class="card-table-wrap">
        <table class="nx-table">
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Item</th><th>Description</th>
              <th>Before</th><th>After</th><th>Performed By</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of filteredLogs" class="nx-row">
              <td>{{log.date | date:'MMM d, y HH:mm'}}</td>
              <td><span class="log-type-badge" [class]="'lt-'+log.type">{{formatLogType(log.type)}}</span></td>
              <td><strong>{{log.item}}</strong></td>
              <td>{{log.description}}</td>
              <td class="td-faint">{{log.before_value || '—'}}</td>
              <td class="td-faint">{{log.after_value || '—'}}</td>
              <td>{{log.performed_by}}</td>
              <td class="td-actions">
                <button class="act del" (click)="deleteLog(log)" title="Delete">✕</button>
              </td>
            </tr>
            <tr *ngIf="filteredLogs.length===0">
              <td colspan="8" class="empty-row">No change log entries.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

   </main><!-- /main -->
  
  </div><!-- /cctv-main-wrapper -->
  
</div><!-- /nexus-shell -->

<!-- ═══════════════════════════════════════════════════════
     MODALS
══════════════════════════════════════════════════════════ -->

<!-- ── Camera Modal ─────────────────────────────────── -->
<div class="nx-modal-overlay" *ngIf="showCameraModal" (click)="closeModals()">
  <div class="nx-modal" (click)="$event.stopPropagation()">
    <div class="nm-header">
      <span class="nm-icon">◎</span>
      <h3>{{editingCamera ? 'Edit Camera' : 'Add New Camera'}}</h3>
      <button class="nm-close" (click)="closeModals()">✕</button>
    </div>
    <div class="nm-body nm-grid-2">
      <div class="nm-field">
        <label>Location *</label>
        <input [(ngModel)]="camForm.location" class="nx-input" placeholder="e.g. Main Entrance">
      </div>
      <div class="nm-field">
        <label>IP Address *</label>
        <input [(ngModel)]="camForm.ip_address" class="nx-input" placeholder="192.168.1.x">
      </div>
      <div class="nm-field">
        <label>RTSP URL</label>
        <input [(ngModel)]="camForm.rtsp_url" class="nx-input" placeholder="rtsp://user:pass@ip/stream">
      </div>
      <div class="nm-field">
        <label>MJPEG Port (for live view)</label>
        <input [(ngModel)]="camForm['mjpeg_port']" class="nx-input" placeholder="e.g. 8080">
      </div>
      <div class="nm-field">
        <label>Camera Type</label>
        <select [(ngModel)]="camForm.type" class="nx-input">
          <option value="">— Select —</option>
          <option>Dome</option><option>Bullet</option><option>PTZ</option>
          <option>IP Camera</option><option>Wireless</option><option>Fisheye</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Resolution</label>
        <select [(ngModel)]="camForm.resolution" class="nx-input">
          <option value="">— Select —</option>
          <option>720p</option><option>1080p</option><option>4MP</option>
          <option>5MP</option><option>4K</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Frame Rate (fps)</label>
        <input type="number" [(ngModel)]="camForm.frame_rate" class="nx-input" placeholder="25">
      </div>
      <div class="nm-field">
        <label>Storage Retention (days)</label>
        <input type="number" [(ngModel)]="camForm.storage_days" class="nx-input" placeholder="30">
      </div>
      <div class="nm-field">
        <label>Status</label>
        <select [(ngModel)]="camForm.status" class="nx-input">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      <div class="nm-field">
        <label>DVR Unit</label>
        <select [(ngModel)]="camForm.dvr_id" class="nx-input">
          <option [ngValue]="null">— None —</option>
          <option *ngFor="let d of dvrs" [ngValue]="d.id">{{d.name}} ({{d.ip_address}})</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Installed Date</label>
        <input type="date" [(ngModel)]="camForm.installed_date" class="nx-input">
      </div>
      <div class="nm-field">
        <label>Last Maintained</label>
        <input type="date" [(ngModel)]="camForm.last_maintained" class="nx-input">
      </div>
      <div class="nm-field nm-full">
        <label>Notes</label>
        <textarea [(ngModel)]="camForm.notes" class="nx-input nx-ta" rows="2" placeholder="Any notes…"></textarea>
      </div>
    </div>
    <div class="nm-footer">
      <button class="nm-btn" (click)="closeModals()">Cancel</button>
      <button class="nm-btn primary" (click)="saveCamera()">{{editingCamera ? 'Update' : 'Save'}}</button>
    </div>
  </div>
</div>

<!-- ── DVR Modal ──────────────────────────────────── -->
<div class="nx-modal-overlay" *ngIf="showDvrModal" (click)="closeModals()">
  <div class="nx-modal" (click)="$event.stopPropagation()">
    <div class="nm-header">
      <span class="nm-icon">▣</span>
      <h3>{{editingDvr ? 'Edit DVR Unit' : 'Add DVR Unit'}}</h3>
      <button class="nm-close" (click)="closeModals()">✕</button>
    </div>
    <div class="nm-body nm-grid-2">
      <div class="nm-field">
        <label>DVR Name *</label>
        <input [(ngModel)]="dvrForm.name" class="nx-input" placeholder="e.g. DVR-Block-A">
      </div>
      <div class="nm-field">
        <label>IP Address *</label>
        <input [(ngModel)]="dvrForm.ip_address" class="nx-input" placeholder="192.168.1.x">
      </div>
      <div class="nm-field">
        <label>Model</label>
        <input [(ngModel)]="dvrForm.model" class="nx-input" placeholder="e.g. Hikvision DS-7208">
      </div>
      <div class="nm-field">
        <label>Physical Location</label>
        <input [(ngModel)]="dvrForm.location" class="nx-input" placeholder="e.g. Server Room A">
      </div>
      <div class="nm-field">
        <label>Total Channels</label>
        <input type="number" [(ngModel)]="dvrForm.channels" class="nx-input" placeholder="16">
      </div>
      <div class="nm-field">
        <label>Used Channels</label>
        <input type="number" [(ngModel)]="dvrForm.used_channels" class="nx-input" placeholder="8">
      </div>
      <div class="nm-field">
        <label>Firmware Version</label>
        <input [(ngModel)]="dvrForm.firmware_version" class="nx-input" placeholder="e.g. V4.31.100">
      </div>
      <div class="nm-field">
        <label>Storage (TB)</label>
        <input type="number" [(ngModel)]="dvrForm.storage_tb" class="nx-input" placeholder="4">
      </div>
      <div class="nm-field">
        <label>Status</label>
        <select [(ngModel)]="dvrForm.status" class="nx-input">
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Installed Date</label>
        <input type="date" [(ngModel)]="dvrForm.installed_date" class="nx-input">
      </div>
      <div class="nm-field nm-full">
        <label>Notes</label>
        <textarea [(ngModel)]="dvrForm.notes" class="nx-input nx-ta" rows="2"></textarea>
      </div>
    </div>
    <div class="nm-footer">
      <button class="nm-btn" (click)="closeModals()">Cancel</button>
      <button class="nm-btn primary" (click)="saveDvr()">{{editingDvr ? 'Update' : 'Save'}}</button>
    </div>
  </div>
</div>

<!-- ── Charger Modal ──────────────────────────────── -->
<div class="nx-modal-overlay" *ngIf="showChargerModal" (click)="closeModals()">
  <div class="nx-modal" (click)="$event.stopPropagation()">
    <div class="nm-header">
      <span class="nm-icon">⚡</span>
      <h3>{{editingCharger ? 'Edit Power Device' : 'Add Power Device'}}</h3>
      <button class="nm-close" (click)="closeModals()">✕</button>
    </div>
    <div class="nm-body nm-grid-2">
      <div class="nm-field">
        <label>Label *</label>
        <input [(ngModel)]="chargerForm.label" class="nx-input" placeholder="e.g. PSU-CAM-01">
      </div>
      <div class="nm-field">
        <label>Device Type</label>
        <select [(ngModel)]="chargerForm.device_type" class="nx-input">
          <option value="">— Select —</option>
          <option>Power Adapter</option><option>PoE Switch</option><option>PoE Injector</option>
          <option>UPS</option><option>Power Strip</option><option>Solar Charger</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Connected To</label>
        <input [(ngModel)]="chargerForm.connected_to" class="nx-input" placeholder="e.g. CAM-01, DVR-A">
      </div>
      <div class="nm-field">
        <label>Watts (W)</label>
        <input type="number" [(ngModel)]="chargerForm.watts" class="nx-input" placeholder="12">
      </div>
      <div class="nm-field">
        <label>IP Address (if PoE/managed)</label>
        <input [(ngModel)]="chargerForm.ip_address" class="nx-input" placeholder="192.168.1.x">
      </div>
      <div class="nm-field">
        <label>Status</label>
        <select [(ngModel)]="chargerForm.status" class="nx-input">
          <option value="ok">OK</option>
          <option value="faulty">Faulty</option>
          <option value="replaced">Replaced</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Installed Date</label>
        <input type="date" [(ngModel)]="chargerForm.installed_date" class="nx-input">
      </div>
      <div class="nm-field">
        <label>Last Checked</label>
        <input type="date" [(ngModel)]="chargerForm.last_checked" class="nx-input">
      </div>
      <div class="nm-field nm-full">
        <label>Notes</label>
        <textarea [(ngModel)]="chargerForm.notes" class="nx-input nx-ta" rows="2"></textarea>
      </div>
    </div>
    <div class="nm-footer">
      <button class="nm-btn" (click)="closeModals()">Cancel</button>
      <button class="nm-btn primary" (click)="saveCharger()">{{editingCharger ? 'Update' : 'Save'}}</button>
    </div>
  </div>
</div>

<!-- ── Log Modal ──────────────────────────────────── -->
<div class="nx-modal-overlay" *ngIf="showLogModal" (click)="closeModals()">
  <div class="nx-modal" (click)="$event.stopPropagation()">
    <div class="nm-header">
      <span class="nm-icon">◫</span>
      <h3>Add Change Log Entry</h3>
      <button class="nm-close" (click)="closeModals()">✕</button>
    </div>
    <div class="nm-body nm-grid-2">
      <div class="nm-field">
        <label>Type *</label>
        <select [(ngModel)]="logForm.type" class="nx-input">
          <option value="camera_added">Camera Added</option>
          <option value="camera_replaced">Camera Replaced</option>
          <option value="dvr_added">DVR Added</option>
          <option value="dvr_replaced">DVR Replaced</option>
          <option value="charger_added">Charger Added</option>
          <option value="charger_replaced">Charger Replaced</option>
          <option value="maintenance">Maintenance</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="nm-field">
        <label>Item (camera/DVR name) *</label>
        <input [(ngModel)]="logForm.item" class="nx-input" placeholder="e.g. CAM-01 Main Entrance">
      </div>
      <div class="nm-field nm-full">
        <label>Description *</label>
        <input [(ngModel)]="logForm.description" class="nx-input" placeholder="Brief description of change">
      </div>
      <div class="nm-field">
        <label>Before Value</label>
        <input [(ngModel)]="logForm.before_value" class="nx-input" placeholder="Old value / model">
      </div>
      <div class="nm-field">
        <label>After Value</label>
        <input [(ngModel)]="logForm.after_value" class="nx-input" placeholder="New value / model">
      </div>
      <div class="nm-field">
        <label>Performed By *</label>
        <input [(ngModel)]="logForm.performed_by" class="nx-input" placeholder="Technician name">
      </div>
      <div class="nm-field">
        <label>Date/Time</label>
        <input type="datetime-local" [(ngModel)]="logForm.date" class="nx-input">
      </div>
    </div>
    <div class="nm-footer">
      <button class="nm-btn" (click)="closeModals()">Cancel</button>
      <button class="nm-btn primary" (click)="saveLog()">Save Entry</button>
    </div>
  </div>
</div>

<!-- ── Quick View Modal ───────────────────────────── -->
<div class="nx-modal-overlay" *ngIf="quickViewCam" (click)="quickViewCam=null">
  <div class="nx-modal qv-modal" (click)="$event.stopPropagation()">
    <div class="nm-header">
      <span class="nm-icon">▶</span>
      <h3>Quick View — {{quickViewCam.location}}</h3>
      <button class="nm-close" (click)="quickViewCam=null">✕</button>
    </div>
    <div class="qv-body">
      <img *ngIf="quickViewCam.status==='active'"
           [src]="getMjpegUrl(quickViewCam)"
           class="qv-video"
           (error)="onFeedError(quickViewCam)"
           alt="Quick View Feed">
      <div class="feed-offline-screen qv-offline" *ngIf="quickViewCam.status!=='active'">
        <span class="offline-icon">○</span>
        <span>{{quickViewCam.status | uppercase}}</span>
        <small>{{quickViewCam.ip_address}}</small>
      </div>
    </div>
  </div>
</div>

<!-- ── Toast ─────────────────────────────────────── -->
<div class="nx-toast" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
  {{toastMessage}}
</div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════
       EDPtech CCTV — Design System
       Aesthetic: Industrial Precision / Dark Control Room
    ═══════════════════════════════════════════════════ */

    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

:host {
  --nx-sidebar-w: 220px;
  --nx-topbar-h: 56px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  display: block;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  
  /* DEFAULT DARK THEME (since darkMode starts as true) */
  --nx-bg: #0d0f14;
  --nx-bg2: #13161e;
  --nx-bg3: #1a1e28;
  --nx-panel: #181b24;
  --nx-border: #262b38;
  --nx-border2: #2e3446;
  --nx-text: #d4d8e8;
  --nx-text2: #8890a8;
  --nx-text3: #5a6278;
  --nx-accent: #00d4ff;
  --nx-accent2: #0099cc;
  --nx-green: #00e676;
  --nx-red: #ff3d3d;
  --nx-orange: #ffaa00;
  --nx-purple: #9c6bff;
}

/* Also fix code elements in light mode */
.nexus-shell:not(.dark) code {
  color: var(--nx-accent);
  background: rgba(0, 119, 170, 0.08);
}
/* Light mode — triggered by .light class on nexus-shell */
.nexus-shell.light {
  --nx-bg: #f0f2f7;
  --nx-bg2: #e8eaf0;
  --nx-bg3: #dde0ea;
  --nx-panel: #ffffff;
  --nx-border: #c8ccd8;
  --nx-border2: #b0b5c8;
  --nx-text: #1a1d2e;
  --nx-text2: #4a5068;
  --nx-text3: #7a82a0;
  --nx-accent: #0077aa;
  --nx-accent2: #005588;
  --nx-green: #00a854;
  --nx-red: #d63030;
  --nx-orange: #cc8800;
  --nx-purple: #6a40cc;
}

.nexus-shell.light code {
  color: var(--nx-accent);
  background: rgba(0, 119, 170, 0.08);
}

.nexus-shell.light .feed-viewport {
  background: #e8eaf0;
}

.nexus-shell.light .feed-offline-screen {
  color: #888;
}

.nexus-shell.light .video-cell {
  background: #e0e0e0;
}

.nexus-shell.light .feed-header {
  background: rgba(255, 255, 255, 0.8);
}

.nexus-shell.light .feed-footer {
  background: rgba(255, 255, 255, 0.7);
}

.nexus-shell.light .feed-live-tag {
  background: rgba(214, 48, 48, 0.85);
  color: white;
}
    /* ── LAYOUT SHELL ─────────────────────────── */
  .nexus-shell {
  display: flex;
  flex-direction: column;  /* ← ADD THIS LINE */
  height: 100vh;
  background: var(--nx-bg);
  color: var(--nx-text);
  overflow: hidden;
}

    /* ── SIDEBAR ──────────────────────────────── */
    .sidebar {
      width: var(--nx-sidebar-w);
      background: var(--nx-panel);
      border-right: 1px solid var(--nx-border);
      display: flex;
      flex-direction: column;
      transition: width .25s ease;
      z-index: 100;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 52px; }
    .sidebar.collapsed .brand-name,
    .sidebar.collapsed .nav-label,
    .sidebar.collapsed .nav-badge { display: none; }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 16px;
      border-bottom: 1px solid var(--nx-border);
    }
    .brand-icon {
      font-size: 22px;
      color: var(--nx-accent);
      flex-shrink: 0;
    }
    .brand-name {
      font-family: 'Rajdhani', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--nx-accent);
    }

    .sidebar-nav { flex: 1; padding: 12px 0; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      border-left: 2px solid transparent;
      color: var(--nx-text2);
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      transition: all .15s;
      white-space: nowrap;
    }
    .nav-item:hover { background: var(--nx-bg3); color: var(--nx-text); }
    .nav-item.active {
      background: rgba(0,212,255,.07);
      border-left-color: var(--nx-accent);
      color: var(--nx-accent);
    }
    .nav-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
    .nav-badge {
      margin-left: auto;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border2);
      color: var(--nx-text2);
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--nx-border);
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border);
      color: var(--nx-text2);
      padding: 5px 9px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .icon-btn:hover { color: var(--nx-text); border-color: var(--nx-accent); }

    /* ── MAIN AREA ────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── TOPBAR ───────────────────────────────── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: var(--nx-topbar-h);
      background: var(--nx-panel);
      border-bottom: 1px solid var(--nx-border);
      flex-shrink: 0;
    }
    .topbar-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--nx-text);
    }
    .topbar-breadcrumb {
      font-size: 10px;
      color: var(--nx-text3);
      text-transform: uppercase;
      letter-spacing: .5px;
    }
    .topbar-right { display: flex; align-items: center; gap: 16px; }
    .live-pulse {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      color: var(--nx-red);
      letter-spacing: 1px;
    }
    .pulse-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--nx-red);
      animation: blink 1.2s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    .clock {
      font-family: 'JetBrains Mono', monospace;
      font-size: 17px;
      font-weight: 500;
      color: var(--nx-accent);
      letter-spacing: 2px;
    }
    .clock-date { font-size: 10px; color: var(--nx-text3); }

    /* ── OVERVIEW TILES ───────────────────────── */
    .overview-tiles {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1px;
      background: var(--nx-border);
      border-bottom: 1px solid var(--nx-border);
      flex-shrink: 0;
    }
    .tile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: var(--nx-bg2);
      border-left: 3px solid var(--nx-border);
    }
    .tile-total  { border-left-color: var(--nx-accent); }
    .tile-active { border-left-color: var(--nx-green); }
    .tile-offline{ border-left-color: var(--nx-red); }
    .tile-maint  { border-left-color: var(--nx-orange); }
    .tile-dvr    { border-left-color: var(--nx-purple); }
    .tile-charger{ border-left-color: #ff6b6b; }
    .tile-icon { font-size: 20px; color: var(--nx-text3); }
    .tile-total .tile-icon  { color: var(--nx-accent); }
    .tile-active .tile-icon { color: var(--nx-green); }
    .tile-offline .tile-icon{ color: var(--nx-red); }
    .tile-maint .tile-icon  { color: var(--nx-orange); }
    .tile-val {
      font-family: 'Rajdhani', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--nx-text);
    }
    .tile-lbl { font-size: 10px; color: var(--nx-text3); text-transform: uppercase; letter-spacing: .5px; }

    /* ── TAB PANEL ────────────────────────────── */
    .tab-panel {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }
    .tab-panel::-webkit-scrollbar { width: 6px; }
    .tab-panel::-webkit-scrollbar-track { background: var(--nx-bg); }
    .tab-panel::-webkit-scrollbar-thumb { background: var(--nx-border2); border-radius: 3px; }

    /* ── TOOLBARS ─────────────────────────────── */
    .monitor-toolbar, .panel-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: var(--nx-panel);
      border: 1px solid var(--nx-border);
      border-radius: 6px;
      flex-wrap: wrap;
    }
    .toolbar-label { font-size: 10px; color: var(--nx-text3); text-transform: uppercase; letter-spacing: .5px; }
    .grid-btn {
      padding: 4px 10px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border);
      color: var(--nx-text2);
      font-size: 11px;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'JetBrains Mono', monospace;
    }
    .grid-btn.sel { background: var(--nx-accent); color: #000; border-color: var(--nx-accent); font-weight: 700; }
    .grid-btn:hover:not(.sel) { border-color: var(--nx-accent); color: var(--nx-accent); }
    .tb-select {
      padding: 5px 8px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border);
      color: var(--nx-text);
      font-size: 11px;
      border-radius: 4px;
    }
    .tb-action-btn {
      padding: 5px 12px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border2);
      color: var(--nx-text2);
      font-size: 11px;
      border-radius: 4px;
      cursor: pointer;
    }
    .tb-action-btn:hover { border-color: var(--nx-accent); color: var(--nx-accent); }
    .tb-action-btn.warn { color: var(--nx-orange); border-color: var(--nx-orange); }
    .search-input {
      padding: 6px 12px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border);
      color: var(--nx-text);
      font-size: 11px;
      border-radius: 4px;
      width: 200px;
    }
    .search-input:focus { outline: none; border-color: var(--nx-accent); }
    .add-btn {
      padding: 6px 14px;
      background: var(--nx-accent);
      color: #000;
      border: none;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
    }
    .add-btn:hover { background: #00aadd; }
    .result-count { margin-left: auto; font-size: 11px; color: var(--nx-text3); }

    /* ── VIDEO GRID ───────────────────────────── */
    .video-grid {
      display: grid;
      gap: 3px;
    }
    .grid-1 { grid-template-columns: 1fr; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }

    .video-cell {
      background: #080a0f;
      border: 1px solid var(--nx-border);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 180px;
      position: relative;
    }
    .feed-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      background: rgba(0,0,0,.6);
      border-bottom: 1px solid var(--nx-border);
    }
    .feed-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--nx-accent);
      font-weight: 500;
    }
    .feed-location { font-size: 11px; color: var(--nx-text); font-weight: 500; }
    .feed-status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }
    .fs-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .fs-active    { color: var(--nx-green); }
    .fs-inactive  { color: var(--nx-text3); }
    .fs-offline   { color: var(--nx-red); }
    .fs-maintenance { color: var(--nx-orange); }

    .feed-viewport {
      flex: 1;
      position: relative;
      background: #050709;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      min-height: 140px;
    }
    .feed-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .feed-error-img { opacity: 0; }
    .feed-error-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: #0a0c12;
      color: var(--nx-orange);
    }
    .feed-error-overlay small { color: var(--nx-text3); font-family: 'JetBrains Mono', monospace; font-size: 9px; word-break: break-all; text-align:center; padding: 0 8px; }
    .feed-error-overlay button { margin-top: 6px; padding: 3px 10px; background: var(--nx-bg3); border: 1px solid var(--nx-orange); color: var(--nx-orange); font-size: 10px; border-radius: 3px; cursor: pointer; }
    .feed-live-tag {
      position: absolute;
      top: 6px; left: 6px;
      background: rgba(255,61,61,.85);
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 2px;
      letter-spacing: 1px;
      font-family: 'JetBrains Mono', monospace;
    }
    .feed-offline-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: var(--nx-text3);
      text-align: center;
      padding: 20px;
      width: 100%;
      height: 100%;
    }
    .offline-icon { font-size: 36px; opacity: .3; }
    .fs-toggle-btn {
      position: absolute;
      bottom: 6px; right: 6px;
      background: rgba(0,0,0,.6);
      border: 1px solid var(--nx-border2);
      color: var(--nx-text2);
      font-size: 14px;
      padding: 2px 7px;
      border-radius: 3px;
      cursor: pointer;
    }
    .fs-toggle-btn:hover { background: rgba(0,212,255,.2); color: var(--nx-accent); }
    .feed-footer {
      display: flex;
      gap: 8px;
      padding: 5px 10px;
      background: rgba(0,0,0,.5);
      border-top: 1px solid var(--nx-border);
      font-size: 10px;
      color: var(--nx-text3);
      align-items: center;
    }
    .feed-action {
      margin-left: auto;
      background: none;
      border: 1px solid var(--nx-border2);
      color: var(--nx-accent);
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
    }
    .feed-action:hover { background: rgba(0,212,255,.1); }
    .no-cameras {
      grid-column: 1/-1;
      text-align: center;
      padding: 60px;
      color: var(--nx-text3);
    }

    /* ── FULLSCREEN OVERLAY ───────────────────── */
    .fullscreen-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.92);
      z-index: 500;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fullscreen-panel {
      background: var(--nx-panel);
      border: 1px solid var(--nx-border2);
      border-radius: 8px;
      width: 90vw;
      max-width: 1100px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .fs-panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: var(--nx-bg);
      border-bottom: 1px solid var(--nx-border);
    }
    .fs-panel-id { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--nx-accent); }
    .fs-panel-loc { font-size: 14px; font-weight: 600; color: var(--nx-text); }
    .fs-panel-ip { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--nx-text3); }
    .fs-close {
      margin-left: auto;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border);
      color: var(--nx-text2);
      padding: 5px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .fs-panel-video {
      flex: 1;
      background: #050709;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      max-height: 55vh;
    }
    .fs-video-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .fs-panel-meta { padding: 14px 20px; border-top: 1px solid var(--nx-border); }
    .fs-meta-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .fs-meta-grid > div { display: flex; flex-direction: column; gap: 3px; }
    .fs-meta-grid label { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: var(--nx-text3); }
    .fs-meta-grid span { font-size: 12px; color: var(--nx-text); font-weight: 500; }
    .fs-panel-actions { display: flex; gap: 8px; }
    .fs-act-btn {
      padding: 6px 14px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border2);
      color: var(--nx-text);
      font-size: 11px;
      border-radius: 4px;
      cursor: pointer;
    }
    .fs-act-btn:hover { border-color: var(--nx-accent); color: var(--nx-accent); }
    .fs-act-btn.warn { border-color: var(--nx-orange); color: var(--nx-orange); }
    .fs-act-btn.maint { border-color: var(--nx-purple); color: var(--nx-purple); }

    /* ── TABLE ────────────────────────────────── */
    .card-table-wrap {
      background: var(--nx-panel);
      border: 1px solid var(--nx-border);
      border-radius: 6px;
      overflow-x: auto;
    }
    .nx-table {
      width: 100%;
      border-collapse: collapse;
    }
    .nx-table th {
      padding: 9px 12px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .6px;
      color: var(--nx-text3);
      background: var(--nx-bg2);
      border-bottom: 1px solid var(--nx-border);
      text-align: left;
      white-space: nowrap;
    }
    .nx-row td {
      padding: 9px 12px;
      border-bottom: 1px solid var(--nx-border);
      font-size: 11px;
      color: var(--nx-text);
      white-space: nowrap;
    }
    .nx-row:last-child td { border-bottom: none; }
    .nx-row:hover td { background: var(--nx-bg3); }
    .td-id { font-family: 'JetBrains Mono', monospace; color: var(--nx-text3); }
    .td-faint { color: var(--nx-text3); font-size: 10px; }
    .url-td { font-size: 10px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; display: block; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--nx-accent); background: rgba(0,212,255,.07); padding: 2px 6px; border-radius: 2px; }
    .empty-row { text-align: center; color: var(--nx-text3); padding: 40px !important; }

    .td-actions { display: flex; gap: 4px; align-items: center; }
    .act {
      background: none;
      border: 1px solid transparent;
      color: var(--nx-text2);
      padding: 3px 7px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    .act:hover { background: var(--nx-bg3); border-color: var(--nx-border2); color: var(--nx-accent); }
    .act.del:hover { border-color: var(--nx-red); color: var(--nx-red); }

    /* ── BADGES ───────────────────────────────── */
    .nx-badge {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .5px;
      display: inline-block;
    }
    .badge-active     { background: rgba(0,230,118,.12); color: var(--nx-green); border: 1px solid rgba(0,230,118,.3); }
    .badge-inactive   { background: rgba(255,61,61,.1); color: var(--nx-red); border: 1px solid rgba(255,61,61,.25); }
    .badge-offline    { background: rgba(100,100,120,.15); color: var(--nx-text3); border: 1px solid var(--nx-border2); }
    .badge-maintenance{ background: rgba(255,170,0,.12); color: var(--nx-orange); border: 1px solid rgba(255,170,0,.3); }
    .badge-online     { background: rgba(0,230,118,.12); color: var(--nx-green); border: 1px solid rgba(0,230,118,.3); }
    .badge-charger-ok       { background: rgba(0,230,118,.12); color: var(--nx-green); border: 1px solid rgba(0,230,118,.3); }
    .badge-charger-faulty   { background: rgba(255,61,61,.1); color: var(--nx-red); border: 1px solid rgba(255,61,61,.25); }
    .badge-charger-replaced { background: rgba(156,107,255,.12); color: var(--nx-purple); border: 1px solid rgba(156,107,255,.3); }

    /* ── DVR CARDS ────────────────────────────── */
    .dvr-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .dvr-card {
      background: var(--nx-panel);
      border: 1px solid var(--nx-border);
      border-radius: 6px;
      padding: 0;
      overflow: hidden;
      border-top: 3px solid var(--nx-border2);
    }
    .dvr-online  { border-top-color: var(--nx-green); }
    .dvr-offline { border-top-color: var(--nx-red); }
    .dvr-maintenance { border-top-color: var(--nx-orange); }
    .dvr-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--nx-border);
      background: var(--nx-bg2);
    }
    .dvr-card-icon { font-size: 18px; color: var(--nx-purple); }
    .dvr-card-title { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .dvr-card-title strong { font-size: 13px; font-weight: 600; color: var(--nx-text); }
    .dvr-card-actions { display: flex; gap: 4px; }
    .dvr-card-body { padding: 12px 16px; }
    .dvr-meta-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--nx-border); font-size: 11px; }
    .dvr-meta-row:last-child { border-bottom: none; }
    .dvr-meta-row label { color: var(--nx-text3); font-size: 10px; }
    .dvr-channel-bar { padding: 10px 16px; border-top: 1px solid var(--nx-border); }
    .dcb-label { display: flex; justify-content: space-between; font-size: 10px; color: var(--nx-text3); margin-bottom: 6px; }
    .dcb-track { height: 4px; background: var(--nx-bg3); border-radius: 2px; }
    .dcb-fill { height: 100%; background: var(--nx-accent); border-radius: 2px; transition: width .4s; }
    .dvr-notes { padding: 8px 16px; font-size: 10px; color: var(--nx-text3); border-top: 1px solid var(--nx-border); background: var(--nx-bg2); }

    /* ── CHARGER SUMMARY ──────────────────────── */
    .charger-summary {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .cs-tile {
      flex: 1;
      padding: 12px 16px;
      border-radius: 6px;
      text-align: center;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .5px;
      border: 1px solid var(--nx-border);
    }
    .cs-tile span { display: block; font-family: 'Rajdhani', sans-serif; font-size: 28px; font-weight: 700; }
    .cs-tile.ok      { color: var(--nx-green); background: rgba(0,230,118,.05); }
    .cs-tile.faulty  { color: var(--nx-red); background: rgba(255,61,61,.05); }
    .cs-tile.replaced{ color: var(--nx-purple); background: rgba(156,107,255,.05); }

    /* ── CHANGE LOG ───────────────────────────── */
    .log-type-badge {
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
    }
    .lt-camera_added     { background: rgba(0,212,255,.1); color: var(--nx-accent); }
    .lt-camera_replaced  { background: rgba(255,170,0,.1); color: var(--nx-orange); }
    .lt-dvr_added        { background: rgba(156,107,255,.1); color: var(--nx-purple); }
    .lt-dvr_replaced     { background: rgba(156,107,255,.15); color: var(--nx-purple); }
    .lt-charger_added    { background: rgba(0,230,118,.1); color: var(--nx-green); }
    .lt-charger_replaced { background: rgba(255,61,61,.1); color: var(--nx-red); }
    .lt-maintenance      { background: rgba(255,170,0,.1); color: var(--nx-orange); }
    .lt-other            { background: var(--nx-bg3); color: var(--nx-text2); }

    /* ── MODALS ───────────────────────────────── */
    .nx-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.75);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nx-modal {
      background: #e0e5f1;
      border: 1px solid var(--nx-border2);
      border-radius: 8px;
      width: 90%;
      max-width: 680px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,.6);
    }
    .nm-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: #fff1f1;
      border-bottom: 1px solid var(--nx-border);
      border-radius: 8px 8px 0 0;
    }
    .nm-icon { font-size: 18px; color: var(--nx-accent); }
    .nm-header h3 { margin: 0; font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 600; color: #050505; flex: 1; }
    .nm-close { background: var(--nx-bg3); border: 1px solid var(--nx-border); color: #f8ecec; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .nm-close:hover { color: var(--nx-red); border-color: var(--nx-red); }
    .nm-body { padding: 20px; color: #000000}
    .nm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .nm-full { grid-column: 1/-1; }
    .nm-field { display: flex; flex-direction: column; gap: 5px; color: #fff}
    .nm-field label { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #000000; font-weight: 500; }
    .nx-input {
      padding: 7px 10px;
      background: #ffgtg5;
      border: 1px solid var(--nx-border2);
      color: #080808;
      font-size: 11px;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;
    }
    .nx-input:focus { outline: none; border-color: var(--nx-accent); box-shadow: 0 0 0 2px rgba(0,212,255,.15); }
    .nx-ta { resize: vertical; min-height: 60px; }
    .nm-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 14px 20px;
      border-top: 1px solid var(--nx-border);
      background: #fff1f1;
      border-radius: 0 0 8px 8px;
    }
    .nm-btn {
      padding: 7px 18px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border2);
      color: var(--nx-text2);
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .nm-btn.primary { background: var(--nx-accent); color: #000; border-color: var(--nx-accent); font-weight: 600; }
    .nm-btn.primary:hover { background: #00aadd; }
    /* ── CCTV NAVIGATION BAR ───────────────────── */
.cctv-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--nx-panel);
  border-bottom: 1px solid var(--nx-border);
  z-index: 200;
  flex-shrink: 0;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid var(--nx-accent);
  color: var(--nx-accent);
  font-size: 11px;
  font-family: 'Inter', sans-serif;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  width: 100%;
  margin-bottom: 8px;
}
.back-btn:hover {
  background: var(--nx-accent);
  color: #000;
}
/* Hide text when sidebar collapsed but keep button visible as icon */
.sidebar.collapsed .back-text { display: none; }

.back-arrow {
  font-size: 14px;
  font-weight: 600;
}

.back-text {
  font-weight: 500;
  letter-spacing: 0.3px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-brand .brand-icon {
  font-size: 18px;
  color: var(--nx-accent);
}

.nav-brand .brand-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--nx-accent);
}

.nav-center {
  display: flex;
  align-items: center;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  background: rgba(255, 61, 61, 0.1);
  border: 1px solid rgba(255, 61, 61, 0.3);
  border-radius: 4px;
  color: var(--nx-red);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  font-family: 'JetBrains Mono', monospace;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--nx-red);
  animation: livePulse 1.5s infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-icon-btn {
  background: var(--nx-bg3);
  border: 1px solid var(--nx-border2);
  color: var(--nx-text2);
  padding: 5px 9px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.nav-icon-btn:hover {
  color: var(--nx-text);
  border-color: var(--nx-accent);
}

/* ── MAIN CONTENT WRAPPER ─────────────────── */
.cctv-main-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-brand {
  display: none;
}

/* ── CCTV AUTH GATE ────────────────────────── */
.cctv-auth-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #fbfcff 0%, #1a1e28 50%, #646875 100%);
}

.cctv-auth-card {
  background: #f0f2f7;
  border: 1px solid #262b38;
  border-radius: 12px;
  padding: 32px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: authSlideIn 0.3s ease;
}

@keyframes authSlideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.cctv-auth-header {
  text-align: center;
  margin-bottom: 24px;
  color: #1a1e28;
}

.cctv-auth-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.cctv-auth-header h2 {
  margin: 0 0 8px 0;
  color: #1a1e28;
  font-size: 20px;
  font-weight: 600;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 1px;
}

.cctv-auth-sub {
  color: #101011;
  font-size: 12px;
  margin: 0;
  line-height: 1.5;
}

.cctv-auth-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 8px;
  color: #000000;
  margin-bottom: 20px;
}

.cctv-user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
  overflow: hidden;
}

.cctv-user-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cctv-user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #000000;
}

.cctv-user-details strong {
  font-size: 14px;
  color: #080808;
}

.cctv-user-details span {
  font-size: 11px;
  color: #1b1b1d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cctv-auth-form {
  margin-bottom: 20px;
}

.cctv-input-group {
  margin-bottom: 14px;
}

.cctv-input-group label {
  display: block;
  font-size: 11px;
  color: #000000;
  margin-bottom: 6px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.cctv-password-wrapper {
  position: relative;
}

.cctv-auth-input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  background: #e9eaec;
  border: 1px solid #2e3446;
  border-radius: 6px;
  color: #030303;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s;
}

.cctv-auth-input:focus {
  outline: none;
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.cctv-auth-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #131414;
}

.cctv-auth-input::placeholder {
  color: #5a6278;
}

.cctv-toggle-password {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8890a8;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 6px;
}

.cctv-toggle-password:hover {
  color: #00d4ff;
}

.cctv-auth-error {
  background: rgba(255, 61, 61, 0.1);
  border: 1px solid rgba(255, 61, 61, 0.3);
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff3d3d;
  font-size: 12px;
}

.error-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.cctv-auth-actions {
  display: flex;
  gap: 10px;
}

.cctv-auth-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cctv-auth-btn.primary {
  flex: 1;
  background: #00d4ff;
  color: #000;
}

.cctv-auth-btn.primary:hover:not(:disabled) {
  background: #00b8e0;
}

.cctv-auth-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cctv-auth-btn.back {
  background: #1a1e28;
  color: #8890a8;
  border: 1px solid #2e3446;
}

.cctv-auth-btn.back:hover {
  background: #2e3446;
  color: #d4d8e8;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cctv-auth-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #262b38;
  font-size: 10px;
  color: #5a6278;
  letter-spacing: 0.5px;
}
    /* Quick View Modal */
    .qv-modal { max-width: 900px; }
    .qv-body { background: #050709; min-height: 400px; display: flex; align-items: center; justify-content: center; }
    .qv-video { width: 100%; max-height: 500px; object-fit: contain; display: block; }
    .qv-offline { min-height: 300px; }

    /* ── TOAST ────────────────────────────────── */
    .nx-toast {
      position: fixed;
      bottom: 24px; right: 24px;
      background: var(--nx-bg3);
      border: 1px solid var(--nx-border2);
      color: var(--nx-text);
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 12px;
      transform: translateY(80px);
      opacity: 0;
      transition: all .25s;
      z-index: 5000;
    }
    .nx-toast.show { transform: translateY(0); opacity: 1; }
    .nx-toast.success { border-color: var(--nx-green); background: rgba(0,230,118,.1); color: var(--nx-green); }
    .nx-toast.error   { border-color: var(--nx-red); background: rgba(255,61,61,.1); color: var(--nx-red); }
  `]
})
export class CctvDashboardComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────
  activeTab: 'monitor' | 'cameras' | 'dvr' | 'chargers' | 'changelog' = 'monitor';
  darkMode = true;
  sidebarCollapsed = false;
  now = new Date();
  isAuthenticated = false;
  apiUrl = environment.apiUrl;
isVerifying = false;
authPassword = '';
authError = '';
currentUser: any = null;
showAuthGate = true;
showPassword = false;
  private clockInterval: any;

  get tabTitle(): string {
    const map: Record<string, string> = {
      monitor: 'Live Monitor', cameras: 'Cameras', dvr: 'DVR Units',
      chargers: 'Power & Chargers', changelog: 'Change Log'
    };
    return map[this.activeTab];
  }

  // ── Data ───────────────────────────────────────
  cameras: Camera[] = [];
  dvrs: DVR[] = [];
  chargers: Charger[] = [];
  changeLogs: ChangeLog[] = [];

  filteredCams: Camera[] = [];
  filteredDvrs: DVR[] = [];
  filteredChargers: Charger[] = [];
  filteredLogs: ChangeLog[] = [];
  monitorCameras: Camera[] = [];

  // ── Filters ────────────────────────────────────
  camSearch = ''; camStatusFilter = '';
  dvrSearch = '';
  chargerSearch = ''; chargerStatusFilter = '';
  logSearch = ''; logTypeFilter = '';
  monitorFilter = 'all';
  gridLayout = 2;

  // ── Feeds ─────────────────────────────────────
  feedErrors: Record<number, boolean> = {};
  fullscreenCam: Camera | null = null;
  quickViewCam: Camera | null = null;

  // ── Stream server (Python Flask on port 5001) ──
  streamBaseUrl = 'http://localhost:5001';

  // ── Modal state ────────────────────────────────
  showCameraModal = false;
  showDvrModal = false;
  showChargerModal = false;
  showLogModal = false;
  editingCamera: Camera | null = null;
  editingDvr: DVR | null = null;
  editingCharger: Charger | null = null;

  // ── Forms ──────────────────────────────────────
  camForm: any = this.blankCamForm();
  dvrForm: any = this.blankDvrForm();
  chargerForm: any = this.blankChargerForm();
  logForm: any = this.blankLogForm();
isFullscreen = false;
  // ── Toast ──────────────────────────────────────
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private router: Router) {}
// Update ngOnInit to include user loading
ngOnInit() {
  // Check authentication
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    this.router.navigate(['/login']);
    return;
  }
  
  // Load current user info
  this.loadCurrentUser();
  
  // Check if already authenticated for CCTV in this session
  const cctvAuth = sessionStorage.getItem('cctv_authenticated');
  if (cctvAuth === 'true') {
    this.isAuthenticated = true;
    this.startCCTVSystem();
  }
}

// Add this method to load user info
loadCurrentUser() {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  this.currentUser = user;
}

// Add this method to start the CCTV system after auth
startCCTVSystem() {
  this.clockInterval = setInterval(() => { 
    this.now = new Date(); 
    this.cd.markForCheck(); 
  }, 1000);
  this.loadAll();
}

// Add this method for CCTV access verification
verifyCCTVAccess() {
  if (!this.authPassword) {
    this.authError = 'Please enter your password';
    return;
  }

  this.isVerifying = true;
  this.authError = '';

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  this.http.post(`${environment.apiUrl}/api/auth/verify-password`, 
    { password: this.authPassword },
    { headers }
  ).subscribe({
    next: (response: any) => {
      if (response.success) {
        this.isAuthenticated = true;
        sessionStorage.setItem('cctv_authenticated', 'true');
        this.authPassword = '';
        this.startCCTVSystem();
      } else {
        this.authError = 'Invalid password. Please try again.';
      }
      this.isVerifying = false;
    },
    error: (err) => {
      console.error('CCTV auth error:', err);
      if (err.status === 401) {
        this.authError = 'Invalid password. Please try again.';
      } else if (err.status === 429) {
        this.authError = 'Too many attempts. Please wait a moment.';
      } else {
        this.authError = err.error?.message || 'Verification failed. Please try again.';
      }
      this.isVerifying = false;
    }
  });
}
  ngOnDestroy() { clearInterval(this.clockInterval); }

  // ── LOAD ───────────────────────────────────────
  loadAll() {
    this.loadCameras();
    this.loadDvrs();
    this.loadChargers();
    this.loadLogs();
  }
goBackToDashboard() {
  // Clear CCTV auth when going back
  sessionStorage.removeItem('cctv_authenticated');
  this.router.navigate(['/dashboard']);
}
  private getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

  loadCameras() {
    this.http.get<Camera[]>(`${environment.apiUrl}/api/cctv`, { headers: this.getHeaders() }).subscribe({
      next: (d) => { this.cameras = Array.isArray(d) ? d : this.mockCameras(); this.filterCams(); this.applyMonitorFilter(); },
      error: () => { this.cameras = this.mockCameras(); this.filterCams(); this.applyMonitorFilter(); }
    });
  }

  loadDvrs() {
    this.http.get<DVR[]>(`${environment.apiUrl}/api/dvr`, { headers: this.getHeaders() }).subscribe({
      next: (d) => { this.dvrs = Array.isArray(d) ? d : this.mockDvrs(); this.filterDvrs(); },
      error: () => { this.dvrs = this.mockDvrs(); this.filterDvrs(); }
    });
  }

  loadChargers() {
    this.http.get<Charger[]>(`${environment.apiUrl}/api/chargers`, { headers: this.getHeaders() }).subscribe({
      next: (d) => { this.chargers = Array.isArray(d) ? d : this.mockChargers(); this.filterChargers(); },
      error: () => { this.chargers = this.mockChargers(); this.filterChargers(); }
    });
  }

  loadLogs() {
    this.http.get<ChangeLog[]>(`${environment.apiUrl}/api/changelog`, { headers: this.getHeaders() }).subscribe({
      next: (d) => { this.changeLogs = Array.isArray(d) ? d : this.mockLogs(); this.filterLogs(); },
      error: () => { this.changeLogs = this.mockLogs(); this.filterLogs(); }
    });
  }

  // ── STREAM URL ────────────────────────────────
  // All streams routed through Python Flask server (port 5001).
  // Python handles RTSP→MJPEG transcoding, CORS, and error recovery.
  getMjpegUrl(cam: Camera): string {
    return `${this.streamBaseUrl}/stream/${cam.id}`;
  }

  getSnapshotUrl(cam: Camera): string {
    return `${this.streamBaseUrl}/snapshot/${cam.id}`;
  }

  onFeedError(cam: Camera) { this.feedErrors[cam.id] = true; }
  retryFeed(cam: Camera) { this.feedErrors[cam.id] = false; }
  refreshAllFeeds() { this.feedErrors = {}; this.showToastMsg('Feeds refreshed', 'success'); }

  takeAllSnapshot() {
    const active = this.monitorCameras.filter(c => c.status === 'active');
    if (active.length === 0) { this.showToastMsg('No active cameras to snapshot', 'error'); return; }
    active.forEach(cam => {
      const a = document.createElement('a');
      a.href = this.getSnapshotUrl(cam);
      a.download = `snapshot_cam${cam.id}_${Date.now()}.jpg`;
      a.click();
    });
    this.showToastMsg(`Snapshots triggered for ${active.length} camera(s)`, 'success');
  }

  checkCameraHealth() {
    const h = this.getHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/cctv/health/all`, { headers: h }).subscribe({
      next: (results) => {
        results.forEach(r => {
          const c = this.cameras.find(cam => cam.id === r.id);
          if (c && r.db_status !== c.status) {
            c.status = r.db_status;
          }
        });
        this.applyMonitorFilter();
        this.filterCams();
        this.showToastMsg('Health check complete', 'success');
      },
      error: () => this.showToastMsg('Python stream server offline', 'error')
    });
  }

  // ── FULLSCREEN ────────────────────────────────
  toggleFullscreen(cam: Camera) {
    this.fullscreenCam = (this.fullscreenCam?.id === cam.id) ? null : cam;
  }
  closeFullscreen() { this.fullscreenCam = null; }
  quickView(cam: Camera) { this.quickViewCam = cam; }

  // ── FILTERS ───────────────────────────────────
  filterCams() {
    let d = [...this.cameras];
    if (this.camSearch.trim()) {
      const t = this.camSearch.toLowerCase();
      d = d.filter(c => c.location?.toLowerCase().includes(t) || c.ip_address?.toLowerCase().includes(t) || c.type?.toLowerCase().includes(t));
    }
    if (this.camStatusFilter) d = d.filter(c => c.status === this.camStatusFilter);
    this.filteredCams = d;
  }

  filterDvrs() {
    const t = this.dvrSearch.toLowerCase();
    this.filteredDvrs = this.dvrs.filter(d =>
      !t || d.name?.toLowerCase().includes(t) || d.ip_address?.toLowerCase().includes(t) || d.location?.toLowerCase().includes(t)
    );
  }

  filterChargers() {
    let d = [...this.chargers];
    if (this.chargerSearch.trim()) {
      const t = this.chargerSearch.toLowerCase();
      d = d.filter(c => c.label?.toLowerCase().includes(t) || c.connected_to?.toLowerCase().includes(t) || c.device_type?.toLowerCase().includes(t));
    }
    if (this.chargerStatusFilter) d = d.filter(c => c.status === this.chargerStatusFilter);
    this.filteredChargers = d;
  }

  filterLogs() {
    let d = [...this.changeLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (this.logSearch.trim()) {
      const t = this.logSearch.toLowerCase();
      d = d.filter(l => l.item?.toLowerCase().includes(t) || l.description?.toLowerCase().includes(t) || l.performed_by?.toLowerCase().includes(t));
    }
    if (this.logTypeFilter) d = d.filter(l => l.type === this.logTypeFilter);
    this.filteredLogs = d;
  }

  applyMonitorFilter() {
    if (this.monitorFilter === 'all') this.monitorCameras = [...this.cameras];
    else this.monitorCameras = this.cameras.filter(c => c.status === this.monitorFilter);
  }

  // ── HELPERS ───────────────────────────────────
  getCount(arr: any[], key: string, val: string): number {
    return arr.filter(i => i[key] === val).length;
  }

  getDvrName(id?: number): string {
    if (!id) return '—';
    return this.dvrs.find(d => d.id === id)?.name || String(id);
  }

  formatLogType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  markMaintenance(cam: Camera) {
    cam.status = 'maintenance';
    cam.last_maintained = new Date().toISOString().split('T')[0];
    this.logChange('maintenance', cam.location, 'Marked for maintenance');
    this.showToastMsg(`CAM-${cam.id} marked as maintenance`, 'success');
    this.applyMonitorFilter();
    this.filterCams();
  }

  openCameraDetail(cam: Camera) { this.activeTab = 'cameras'; this.editCamera(cam); }

  // ── CAMERA CRUD ───────────────────────────────
  openCameraModal() { this.editingCamera = null; this.camForm = this.blankCamForm(); this.showCameraModal = true; }
  editCamera(cam: Camera) { this.editingCamera = cam; this.camForm = { ...cam }; this.showCameraModal = true; }

  saveCamera() {
    if (!this.camForm.location || !this.camForm.ip_address) {
      this.showToastMsg('Location and IP are required', 'error'); return;
    }
    const h = { ...this.getHeaders(), 'Content-Type': 'application/json' };
    const isEdit = !!this.editingCamera;
    const req = isEdit
      ? this.http.put(`${environment.apiUrl}/api/cctv/${this.editingCamera!.id}`, this.camForm, { headers: h })
      : this.http.post(`${environment.apiUrl}/api/cctv`, this.camForm, { headers: h });

    req.subscribe({
      next: () => { this.closeModals(); this.loadCameras(); this.showToastMsg(isEdit ? 'Camera updated' : 'Camera added', 'success'); },
      error: () => {
        // Offline fallback
        if (isEdit) {
          const i = this.cameras.findIndex(c => c.id === this.editingCamera!.id);
          if (i > -1) this.cameras[i] = { ...this.cameras[i], ...this.camForm };
        } else {
          this.cameras.push({ ...this.camForm, id: Date.now() });
          this.logChange('camera_added', this.camForm.location, 'New camera installed');
        }
        this.filterCams(); this.applyMonitorFilter();
        this.closeModals();
        this.showToastMsg(isEdit ? 'Camera updated (local)' : 'Camera added (local)', 'success');
      }
    });
  }

  deleteCamera(cam: Camera) {
    if (!confirm(`Delete camera at "${cam.location}"?`)) return;
    const h = this.getHeaders();
    this.http.delete(`${environment.apiUrl}/api/cctv/${cam.id}`, { headers: h }).subscribe({
      next: () => { this.cameras = this.cameras.filter(c => c.id !== cam.id); this.filterCams(); this.applyMonitorFilter(); },
      error: () => { this.cameras = this.cameras.filter(c => c.id !== cam.id); this.filterCams(); this.applyMonitorFilter(); }
    });
    this.showToastMsg('Camera deleted', 'success');
  }

  // ── DVR CRUD ──────────────────────────────────
  openDvrModal() { this.editingDvr = null; this.dvrForm = this.blankDvrForm(); this.showDvrModal = true; }
  editDvr(dvr: DVR) { this.editingDvr = dvr; this.dvrForm = { ...dvr }; this.showDvrModal = true; }

  saveDvr() {
    if (!this.dvrForm.name || !this.dvrForm.ip_address) { this.showToastMsg('Name and IP required', 'error'); return; }
    const isEdit = !!this.editingDvr;
    const h = { ...this.getHeaders(), 'Content-Type': 'application/json' };
    const req = isEdit
      ? this.http.put(`${environment.apiUrl}/api/dvr/${this.editingDvr!.id}`, this.dvrForm, { headers: h })
      : this.http.post(`${environment.apiUrl}/api/dvr`, this.dvrForm, { headers: h });

    req.subscribe({
      next: () => { this.closeModals(); this.loadDvrs(); this.showToastMsg(isEdit ? 'DVR updated' : 'DVR added', 'success'); },
      error: () => {
        if (isEdit) {
          const i = this.dvrs.findIndex(d => d.id === this.editingDvr!.id);
          if (i > -1) this.dvrs[i] = { ...this.dvrs[i], ...this.dvrForm };
        } else {
          this.dvrs.push({ ...this.dvrForm, id: Date.now() });
          this.logChange('dvr_added', this.dvrForm.name, 'New DVR unit installed');
        }
        this.filterDvrs(); this.closeModals();
        this.showToastMsg(isEdit ? 'DVR updated (local)' : 'DVR added (local)', 'success');
      }
    });
  }

  deleteDvr(dvr: DVR) {
    if (!confirm(`Delete DVR "${dvr.name}"?`)) return;
    this.dvrs = this.dvrs.filter(d => d.id !== dvr.id);
    this.filterDvrs();
    this.showToastMsg('DVR removed', 'success');
  }

  // ── CHARGER CRUD ──────────────────────────────
  openChargerModal() { this.editingCharger = null; this.chargerForm = this.blankChargerForm(); this.showChargerModal = true; }
  editCharger(c: Charger) { this.editingCharger = c; this.chargerForm = { ...c }; this.showChargerModal = true; }

  saveCharger() {
    if (!this.chargerForm.label) { this.showToastMsg('Label required', 'error'); return; }
    const isEdit = !!this.editingCharger;
    const h = { ...this.getHeaders(), 'Content-Type': 'application/json' };
    const req = isEdit
      ? this.http.put(`${environment.apiUrl}/api/chargers/${this.editingCharger!.id}`, this.chargerForm, { headers: h })
      : this.http.post(`${environment.apiUrl}/api/chargers`, this.chargerForm, { headers: h });

    req.subscribe({
      next: () => { this.closeModals(); this.loadChargers(); this.showToastMsg(isEdit ? 'Device updated' : 'Device added', 'success'); },
      error: () => {
        if (isEdit) {
          const i = this.chargers.findIndex(c => c.id === this.editingCharger!.id);
          if (i > -1) this.chargers[i] = { ...this.chargers[i], ...this.chargerForm };
        } else {
          this.chargers.push({ ...this.chargerForm, id: Date.now() });
          this.logChange('charger_added', this.chargerForm.label, 'New power device added');
        }
        this.filterChargers(); this.closeModals();
        this.showToastMsg(isEdit ? 'Device updated (local)' : 'Device added (local)', 'success');
      }
    });
  }

  deleteCharger(c: Charger) {
    if (!confirm(`Delete "${c.label}"?`)) return;
    this.chargers = this.chargers.filter(x => x.id !== c.id);
    this.filterChargers();
    this.showToastMsg('Device removed', 'success');
  }

  // ── CHANGE LOG CRUD ───────────────────────────
  openLogModal() { this.logForm = this.blankLogForm(); this.showLogModal = true; }

  logChange(type: ChangeLog['type'], item: string, description: string) {
    const entry: ChangeLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      type,
      item,
      description,
      performed_by: 'Admin'
    };
    this.changeLogs.unshift(entry);
    this.filterLogs();
    // Fire and forget to API
    const h = { ...this.getHeaders(), 'Content-Type': 'application/json' };
    this.http.post(`${environment.apiUrl}/api/changelog`, entry, { headers: h }).subscribe({ error: () => {} });
  }

  saveLog() {
    if (!this.logForm.item || !this.logForm.description || !this.logForm.performed_by) {
      this.showToastMsg('Fill required fields', 'error'); return;
    }
    const entry: ChangeLog = { ...this.logForm, id: Date.now() };
    if (!entry.date) entry.date = new Date().toISOString();
    this.changeLogs.unshift(entry);
    this.filterLogs();
    this.closeModals();
    this.showToastMsg('Log entry saved', 'success');
    const h = { ...this.getHeaders(), 'Content-Type': 'application/json' };
    this.http.post(`${environment.apiUrl}/api/changelog`, entry, { headers: h }).subscribe({ error: () => {} });
  }

  deleteLog(log: ChangeLog) {
    this.changeLogs = this.changeLogs.filter(l => l.id !== log.id);
    this.filterLogs();
  }

  // ── MODAL ─────────────────────────────────────
  closeModals() {
    this.showCameraModal = false;
    this.showDvrModal = false;
    this.showChargerModal = false;
    this.showLogModal = false;
    this.editingCamera = null;
    this.editingDvr = null;
    this.editingCharger = null;
  }

  // ── TOAST ─────────────────────────────────────
  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3500);
  }

  // ── BLANK FORMS ───────────────────────────────
  blankCamForm() {
    return { location: '', ip_address: '', rtsp_url: '', type: '', resolution: '', status: 'active', frame_rate: 25, storage_days: 30, dvr_id: null, installed_date: '', last_maintained: '', notes: '', mjpeg_port: 80 };
  }
  blankDvrForm() {
    return { name: '', ip_address: '', model: '', location: '', channels: 16, used_channels: 0, status: 'online', firmware_version: '', storage_tb: 4, installed_date: '', notes: '' };
  }
  blankChargerForm() {
    return { label: '', device_type: '', connected_to: '', watts: null, ip_address: '', status: 'ok', installed_date: '', last_checked: '', notes: '' };
  }
  blankLogForm() {
    return { type: 'camera_added', item: '', description: '', before_value: '', after_value: '', performed_by: '', date: '' };
  }

  // ── MOCK DATA (shown when API not reachable) ──
  private mockCameras(): Camera[] {
    return [
      { id: 1, location: 'Main Entrance', ip_address: '192.168.1.101', type: 'Dome', resolution: '1080p', status: 'active', installed_date: '2024-01-15', last_maintained: '2025-03-10', dvr_id: 1, frame_rate: 25, storage_days: 30 },
      { id: 2, location: 'Parking Lot A', ip_address: '192.168.1.102', type: 'Bullet', resolution: '4K', status: 'active', installed_date: '2024-02-10', last_maintained: '2025-02-20', dvr_id: 1, frame_rate: 30, storage_days: 30 },
      { id: 3, location: 'Lobby', ip_address: '192.168.1.103', type: 'PTZ', resolution: '4MP', status: 'maintenance', installed_date: '2024-01-20', last_maintained: '2025-04-01', dvr_id: 2, frame_rate: 25, storage_days: 15 },
      { id: 4, location: 'Server Room', ip_address: '192.168.1.104', type: 'Dome', resolution: '1080p', status: 'active', installed_date: '2024-03-05', last_maintained: '2025-03-15', dvr_id: 2, frame_rate: 25, storage_days: 60 },
      { id: 5, location: 'Exit Gate', ip_address: '192.168.1.105', type: 'Bullet', resolution: '1080p', status: 'offline', installed_date: '2024-04-01', dvr_id: 1, frame_rate: 15, storage_days: 30 },
      { id: 6, location: 'Rooftop North', ip_address: '192.168.1.106', type: 'PTZ', resolution: '4K', status: 'active', installed_date: '2024-05-10', last_maintained: '2025-05-01', dvr_id: 2, frame_rate: 30, storage_days: 30 },
    ];
  }

  private mockDvrs(): DVR[] {
    return [
      { id: 1, name: 'DVR-Block-A', ip_address: '192.168.1.10', model: 'Hikvision DS-7208HUHI-K2', channels: 8, used_channels: 5, location: 'Server Room Rack 1', status: 'online', installed_date: '2024-01-10', firmware_version: 'V4.31.100', storage_tb: 4, notes: 'Primary DVR for main building' },
      { id: 2, name: 'DVR-Block-B', ip_address: '192.168.1.11', model: 'Dahua XVR5116H', channels: 16, used_channels: 4, location: 'Server Room Rack 2', status: 'online', installed_date: '2024-03-01', firmware_version: 'V4.001.0000000', storage_tb: 8, notes: 'Annex building cameras' },
    ];
  }

  private mockChargers(): Charger[] {
    return [
      { id: 1, label: 'PSU-CAM-01', device_type: 'Power Adapter', connected_to: 'CAM-01 Main Entrance', watts: 12, status: 'ok', installed_date: '2024-01-15', last_checked: '2025-04-10' },
      { id: 2, label: 'POE-SW-01', device_type: 'PoE Switch', connected_to: 'CAM-02, CAM-03, CAM-04', ip_address: '192.168.1.20', watts: 150, status: 'ok', installed_date: '2024-01-10', last_checked: '2025-03-20' },
      { id: 3, label: 'PSU-CAM-05', device_type: 'Power Adapter', connected_to: 'CAM-05 Exit Gate', watts: 12, status: 'faulty', installed_date: '2024-04-01', last_checked: '2025-05-01', notes: 'Suspected short circuit — schedule replacement' },
    ];
  }

  private mockLogs(): ChangeLog[] {
    return [
      { id: 1, date: '2025-05-01T10:30:00', type: 'maintenance', item: 'CAM-03 Lobby', description: 'Lens cleaned, mount adjusted', performed_by: 'Juan Dela Cruz' },
      { id: 2, date: '2025-04-15T09:00:00', type: 'charger_replaced', item: 'PSU-CAM-03', description: 'Faulty power adapter replaced', before_value: 'Generic 12V 1A', after_value: 'Hikvision OEM 12V 2A', performed_by: 'Maria Santos' },
      { id: 3, date: '2025-03-10T14:00:00', type: 'dvr_replaced', item: 'DVR-Block-A', description: 'HDD upgrade from 2TB to 4TB', before_value: '2TB WD', after_value: '4TB Seagate Surveillance', performed_by: 'Juan Dela Cruz' },
      { id: 4, date: '2025-02-20T11:15:00', type: 'camera_added', item: 'CAM-06 Rooftop North', description: 'New PTZ camera installed for rooftop coverage', performed_by: 'Vendor: SecureVision PH', after_value: 'Hikvision DS-2DE4A425IWG-E' },
    ];
  }
}