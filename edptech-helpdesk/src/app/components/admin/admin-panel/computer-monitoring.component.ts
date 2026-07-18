import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-computer-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="monitoring-container">
      <div class="page-header">
        <h2>💻 Computer Monitoring</h2>
        <span class="header-sub">Monitor systems, licenses, and Microsoft product expirations</span>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item"><span class="stat-label">Total PCs</span><span class="stat-value">{{ totalComputers }}</span></div>
        <div class="stat-item warning"><span class="stat-label">Expiring Soon</span><span class="stat-value">{{ expiringCount }}</span></div>
        <div class="stat-item danger"><span class="stat-label">Expired</span><span class="stat-value">{{ expiredCount }}</span></div>
        <div class="stat-item online"><span class="stat-label">Online</span><span class="stat-value">{{ onlineCount }}</span></div>
        <div class="stat-item"><span class="stat-label">Office Expiring</span><span class="stat-value office-warn">{{ officeExpiringCount }}</span></div>
        <div class="stat-item"><span class="stat-label">AV Updates</span><span class="stat-value av-warn">{{ avUpdateCount }}</span></div>
      </div>

      <!-- Warning Alert -->
      <div class="expiry-alert" *ngIf="expiringCount > 0 || officeExpiringCount > 0 || avUpdateCount > 0">
        <span class="alert-icon">⚠️</span>
        <div class="alert-messages">
          <div *ngIf="expiringCount > 0"><strong>{{ expiringCount }}</strong> computer(s) have Microsoft licenses expiring within 30 days!</div>
          <div *ngIf="officeExpiringCount > 0"><strong>{{ officeExpiringCount }}</strong> computer(s) have Office activation expiring!</div>
          <div *ngIf="avUpdateCount > 0"><strong>{{ avUpdateCount }}</strong> computer(s) need antivirus update!</div>
        </div>
      </div>

      <!-- Notification Bar -->
      <div class="notification-bar" *ngIf="notifications.length > 0">
        <div class="notification-item" *ngFor="let notif of notifications.slice(0, 3)" [class.critical]="notif.type === 'expired'" [class.warning]="notif.type === 'expiring'">
          <span class="notif-icon">{{ notif.type === 'expired' ? '🔴' : notif.type === 'expiring' ? '🟡' : '🟢' }}</span>
          <span class="notif-text">{{ notif.message }}</span>
          <button class="notif-close" (click)="dismissNotification(notif)">✕</button>
        </div>
        <button class="notif-toggle" *ngIf="notifications.length > 3" (click)="showAllNotifications = !showAllNotifications">
          {{ showAllNotifications ? '🔼 Show Less' : '🔽 ' + (notifications.length - 3) + ' more' }}
        </button>
        <div class="notification-item" *ngFor="let notif of notifications.slice(3)" [hidden]="!showAllNotifications" [class.critical]="notif.type === 'expired'" [class.warning]="notif.type === 'expiring'">
          <span class="notif-icon">{{ notif.type === 'expired' ? '🔴' : notif.type === 'expiring' ? '🟡' : '🟢' }}</span>
          <span class="notif-text">{{ notif.message }}</span>
          <button class="notif-close" (click)="dismissNotification(notif)">✕</button>
        </div>
      </div>

     <!-- Filter Bar -->
<div class="filter-bar">
  <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" class="filter-input" placeholder="Computer name, user, IP, location...">
  <select [(ngModel)]="filterExpiry" (change)="applyFilters()" class="filter-select">
    <option value="all">All Computers</option>
    <option value="expiring">Expiring Soon</option>
    <option value="expired">Expired</option>
    <option value="active">Active Licenses</option>
    <option value="office">Office Expiring</option>
    <option value="av">AV Update Needed</option>
  </select>
  <select [(ngModel)]="filterLocation" (change)="applyFilters()" class="filter-select">
    <option value="all">All Locations</option>
    <option *ngFor="let loc of uniqueLocations" [value]="loc">{{ loc }}</option>
  </select>
  <span class="cache-badge" [class.from-cache]="isFromCache" [class.from-server]="!isFromCache && pcs.length > 0" title="Data source indicator">
    {{ isFromCache ? '💾 Cached' : pcs.length > 0 ? '🌐 Live' : '' }}
  </span>
  <button class="btn btn-primary" (click)="triggerScan()">🔄 Scan Network</button>
  
  <!-- ✅ Cleaning Records toggle button -->
  <button class="btn btn-cleaning" (click)="filterCleanedPCs()" [class.active-filter]="showCleanedOnly" title="Show computers with cleaning records">
    🧹 Cleaning Records
    <span class="badge-count" *ngIf="cleanedPCsCount > 0">{{ cleanedPCsCount }}</span>
  </button>

  <!-- ✅ NEW: Back to All button - only shows when filter is active -->
  <button class="btn btn-back-all" *ngIf="showCleanedOnly" (click)="filterCleanedPCs()" title="Show all computers">
    📋 Show All Computers
  </button>
  
  <button class="btn" (click)="forceRefresh()" title="Force refresh from server">🔄 Refresh</button>
  <button class="btn" (click)="addPC()">➕ Add PC</button>
  <button class="btn" (click)="openCleaningModal()" title="Cleaning & Maintenance Records">🧹 New Cleaning</button>
  <span class="count-badge">{{ filteredPCs.length }} computer(s)</span>
</div>
      <!-- Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Computer Name</th>
              <th>User</th>
              <th>Location</th>
              <th>IP Address</th>
              <th>OS</th>
              <th>MS License</th>
              <th>License Expiry</th>
              <th>Office Activation</th>
              <th>Office Expiry</th>
              <th>AV Status</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pc of filteredPCs" [class.expiring-row]="isExpiring(pc) || isOfficeExpiring(pc)" [class.expired-row]="isExpired(pc) || isOfficeExpired(pc)">
              <td><strong>{{ pc.computer_name }}</strong></td>
              <td>{{ pc.user_name || '—' }}</td>
              <td><span class="location-badge" *ngIf="pc.location">📍 {{ pc.location }}</span><span *ngIf="!pc.location">—</span></td>
              <td><code>{{ pc.ip_address }}</code></td>
              <td>
              <strong>{{ pc.os || '—' }}</strong>
              <div><small>{{ pc.bit || '64' }}bit</small></div>
            </td>
              <td><span class="license-badge" [class]="getLicenseClass(pc)">{{ pc.ms_license_type || '—' }}</span></td>
              <td>
                <div class="expiry-cell" [class.expiring]="isExpiring(pc)" [class.expired]="isExpired(pc)">
                  <strong>{{ pc.license_expiry ? (pc.license_expiry | date:'MMM d, yyyy') : '—' }}</strong>
                  <div class="countdown" *ngIf="getDaysRemaining(pc) <= 30 && getDaysRemaining(pc) > 0">🔴 {{ getDaysRemaining(pc) }} days left</div>
                  <div class="countdown expired-text" *ngIf="getDaysRemaining(pc) <= 0 && pc.license_expiry">❌ EXPIRED</div>
                </div>
              </td>
          <!-- Office Activation column -->
<td>
  <span class="license-badge" 
    [class.active]="!isOfficeExpired(pc) && isValidOfficeDate(pc)" 
    [class.expiring]="isOfficeExpiring(pc)" 
    [class.expired]="isOfficeExpired(pc)">
    {{ isValidOfficeDate(pc) ? 'Activated' : (pc.office_activation === 'Expired' ? 'Expired' : 'N/A') }}
  </span>
  <div class="countdown" *ngIf="isValidDate(pc.office_activation_date)">
    <small>Since: {{ pc.office_activation_date | date:'MMM yyyy' }}</small>
  </div>
</td><!-- Office Expiry column -->
<td>
  <div class="expiry-cell" [class.expiring]="isOfficeExpiring(pc)" [class.expired]="isOfficeExpired(pc)">
    <strong>{{ isValidDate(pc.office_expiry) ? (pc.office_expiry | date:'MMM d, yyyy') : '—' }}</strong>
    <div class="countdown" *ngIf="getOfficeDaysRemaining(pc) <= 30 && getOfficeDaysRemaining(pc) > 0 && isValidDate(pc.office_expiry)">🔴 {{ getOfficeDaysRemaining(pc) }} days left</div>
    <div class="countdown expired-text" *ngIf="getOfficeDaysRemaining(pc) <= 0 && isValidDate(pc.office_expiry)">❌ EXPIRED</div>
  </div>
</td>
             <!-- AV Status column -->
<td>
  <span class="status-badge" [class]="'status-' + getAVStatus(pc)">{{ pc.antivirus || 'N/A' }}</span>
  <div class="countdown" *ngIf="isValidDate(pc.av_last_update)">
    <small>Updated: {{ pc.av_last_update | date:'MMM yyyy' }}</small>
  </div>
</td>
              <td><span class="status-badge" [class]="'status-' + (pc.status || 'unknown')">{{ pc.status || 'unknown' }}</span></td>
              <td class="actions-cell">
  <button class="action-btn" (click)="viewDetail(pc)" title="View Details">👁️</button>
  <button class="action-btn" (click)="editPC(pc)" title="Edit">✏️</button>
  <button class="action-btn check" (click)="checkLicenseStatus(pc)" title="Check License">🔍</button>
  <button class="action-btn clean" (click)="openCleaningModal(pc)" title="Cleaning Record">🧹</button>
  <button class="action-btn history" (click)="viewCleaningHistory(pc)" title="Cleaning History">📋</button>
  <button class="action-btn" (click)="deletePC(pc)" title="Delete">🗑️</button>
</td>
            </tr>
            <tr *ngIf="filteredPCs.length === 0">
              <td colspan="12" class="empty-row">{{ pcs.length === 0 ? 'Loading computers...' : 'No computers found' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal - Original format restored -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content" id="editModal" (click)="$event.stopPropagation()" [style.left.px]="modalPositions['editModal'].x" 
[style.top.px]="modalPositions['editModal'].y">
        <div class="modal-header modal-drag-handle" (mousedown)="startDrag($event, 'editModal')">
          <h3>{{ editingPC ? '✏️ Edit PC' : '➕ Add PC' }}</h3>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group half">
              <label>Computer Name:</label>
              <input type="text" [(ngModel)]="formData.computer_name" class="form-input" placeholder="e.g., PC-001">
            </div>
            <div class="form-group half">
              <label>User Name:</label>
              <input type="text" [(ngModel)]="formData.user_name" class="form-input" placeholder="e.g., John Doe">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Location:</label>
              <input type="text" [(ngModel)]="formData.location" class="form-input" placeholder="e.g., EDP Office" list="location-suggestions">
              <datalist id="location-suggestions">
                <option *ngFor="let loc of existingLocations" [value]="loc">{{ loc }}</option>
              </datalist>
            </div>
            <div class="form-group half">
              <label>IP Address:</label>
              <input type="text" [(ngModel)]="formData.ip_address" class="form-input" placeholder="e.g., 192.168.1.100" (blur)="checkIpDuplicate()">
              <small *ngIf="ipDuplicateError" class="error-text">{{ ipDuplicateError }}</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Department:</label>
              <select [(ngModel)]="formData.department" class="form-input">
                <option value="">— Select Department —</option>
                <option *ngFor="let dept of departments" [value]="dept.name">{{ dept.name }}</option>
              </select>
            </div>
            <div class="form-group half"></div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Operating System:</label>
              <select [(ngModel)]="formData.os" class="form-input">
                <option value="">— Select OS —</option>
                <option *ngFor="let os of osList" [value]="os">{{ os }}</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Architecture:</label>
              <select [(ngModel)]="formData.bit" class="form-input">
                <option value="32">32-bit</option>
                <option value="64">64-bit</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>RAM:</label>
              <select [(ngModel)]="formData.ram" class="form-input">
                <option value="">— Select RAM —</option>
                <option value="2 GB">2 GB</option>
                <option value="4 GB">4 GB</option>
                <option value="6 GB">6 GB</option>
                <option value="8 GB">8 GB</option>
                <option value="12 GB">12 GB</option>
                <option value="16 GB">16 GB</option>
                <option value="32 GB">32 GB</option>
                <option value="64 GB">64 GB</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Storage:</label>
              <select [(ngModel)]="formData.storage" class="form-input">
                <option value="">— Select Storage —</option>
                <option value="128 GB SSD">128 GB SSD</option>
                <option value="256 GB SSD">256 GB SSD</option>
                <option value="512 GB SSD">512 GB SSD</option>
                <option value="1 TB SSD">1 TB SSD</option>
                <option value="2 TB SSD">2 TB SSD</option>
                <option value="500 GB HDD">500 GB HDD</option>
                <option value="1 TB HDD">1 TB HDD</option>
                <option value="2 TB HDD">2 TB HDD</option>
                <option value="256 GB SSD + 1 TB HDD">256 GB SSD + 1 TB HDD</option>
                <option value="512 GB SSD + 1 TB HDD">512 GB SSD + 1 TB HDD</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Processor:</label>
            <input type="text" [(ngModel)]="formData.processor" class="form-input" placeholder="e.g., Intel Core i5-12400, AMD Ryzen 5">
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Anti Virus:</label>
              <select [(ngModel)]="formData.antivirus" class="form-input">
                <option value="">— Select Anti Virus —</option>
                <option value="Trellix">Trellix</option>
                <option value="Windows Defender">Windows Defender</option>
                <option value="McAfee">McAfee</option>
                <option value="Norton">Norton</option>
                <option value="Kaspersky">Kaspersky</option>
                <option value="Bitdefender">Bitdefender</option>
                <option value="ESET">ESET</option>
                <option value="Avast">Avast</option>
                <option value="AVG">AVG</option>
                <option value="Trend Micro">Trend Micro</option>
                <option value="Sophos">Sophos</option>
                <option value="None">None</option>
              </select>
            </div>
            <div class="form-group half">
              <label>MAC Address:</label>
              <input type="text" [(ngModel)]="formData.mac_address" class="form-input" placeholder="e.g., 00:1A:2B:3C:4D:5E">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Microsoft License Type:</label>
              <select [(ngModel)]="formData.ms_license_type" class="form-input">
                <option value="">— Select License —</option>
                <optgroup label="Windows 7">
                  <option value="Windows 7 Home">Windows 7 Home</option>
                  <option value="Windows 7 Pro">Windows 7 Pro</option>
                  <option value="Windows 7 Enterprise">Windows 7 Enterprise</option>
                </optgroup>
                <optgroup label="Windows 8/8.1">
                  <option value="Windows 8 Home">Windows 8 Home</option>
                  <option value="Windows 8 Pro">Windows 8 Pro</option>
                  <option value="Windows 8.1 Home">Windows 8.1 Home</option>
                  <option value="Windows 8.1 Pro">Windows 8.1 Pro</option>
                </optgroup>
                <optgroup label="Windows 10">
                  <option value="Windows 10 Home">Windows 10 Home</option>
                  <option value="Windows 10 Pro">Windows 10 Pro</option>
                  <option value="Windows 10 Enterprise">Windows 10 Enterprise</option>
                </optgroup>
                <optgroup label="Windows 11">
                  <option value="Windows 11 Home">Windows 11 Home</option>
                  <option value="Windows 11 Pro">Windows 11 Pro</option>
                  <option value="Windows 11 Enterprise">Windows 11 Enterprise</option>
                </optgroup>
                <optgroup label="Windows Server">
                  <option value="Windows Server 2012">Windows Server 2012</option>
                  <option value="Windows Server 2016">Windows Server 2016</option>
                  <option value="Windows Server 2019">Windows Server 2019</option>
                  <option value="Windows Server 2022">Windows Server 2022</option>
                </optgroup>
                <optgroup label="Microsoft 365 / Office">
                  <option value="Office 365 Business">Office 365 Business</option>
                  <option value="Office 365 Enterprise">Office 365 Enterprise</option>
                  <option value="Microsoft 365 Business">Microsoft 365 Business</option>
                  <option value="Microsoft 365 Enterprise">Microsoft 365 Enterprise</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="OEM License">OEM License</option>
                  <option value="Retail License">Retail License</option>
                  <option value="Volume License">Volume License</option>
                  <option value="None / Unlicensed">None / Unlicensed</option>
                </optgroup>
              </select>
            </div>
            <div class="form-group half"></div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>License Activation Date:</label>
              <input type="date" [(ngModel)]="formData.license_activation" class="form-input" (change)="calculateExpiry()">
            </div>
            <div class="form-group half">
              <label>License Duration:</label>
              <select [(ngModel)]="formData.license_duration" class="form-input" (change)="calculateExpiry()">
                <option value="">— Select Duration —</option>
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
                <option value="24">2 Years</option>
                <option value="36">3 Years</option>
                <option value="60">5 Years</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>License Expiry Date:</label>
              <input type="date" [(ngModel)]="formData.license_expiry" class="form-input" readonly style="background-color: #f5f5f5;">
              <small class="hint-text" *ngIf="formData.license_activation && formData.license_duration">Auto-calculated from activation date + duration</small>
            </div>
            <div class="form-group half"></div>
          </div>
          <!-- ✅ ADD THESE OFFICE FIELDS TO THE ADD/EDIT MODAL -->
<div class="form-row">
  <div class="form-group half">
    <label>Office Activation Date:</label>
    <input type="date" [(ngModel)]="formData.office_activation_date" class="form-input">
  </div>
  <div class="form-group half">
    <label>Office Duration:</label>
    <select [(ngModel)]="formData.office_duration" class="form-input" (change)="calculateOfficeExpiryForForm()">
      <option value="">— Select Duration —</option>
      <option value="1">1 Month</option>
      <option value="3">3 Months</option>
      <option value="6">6 Months</option>
      <option value="12">1 Year</option>
      <option value="24">2 Years</option>
      <option value="36">3 Years</option>
    </select>
  </div>
</div>

<div class="form-row" *ngIf="formData.office_expiry">
  <div class="form-group half">
    <label>Office Expiry Date:</label>
    <input type="date" [(ngModel)]="formData.office_expiry" class="form-input" readonly style="background-color: #f5f5f5;">
    <small class="hint-text">Auto-calculated</small>
  </div>
  <div class="form-group half">
    <label>Office Status:</label>
    <input type="text" [value]="formData.office_expiry ? (isOfficeExpiredForm() ? 'Expired' : 'Activated') : '—'" class="form-input" readonly style="background-color: #f5f5f5;">
  </div>
</div>

<!-- ✅ ADD AV FIELDS -->
<div class="form-row">
  <div class="form-group half">
    <label>AV Last Update:</label>
    <input type="date" [(ngModel)]="formData.av_last_update" class="form-input">
  </div>
  <div class="form-group half">
    <label>AV Next Update:</label>
    <input type="date" [(ngModel)]="formData.av_next_update" class="form-input">
  </div>
</div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="savePC()">{{ editingPC ? 'Update' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" *ngIf="showDetailModal" (click)="closeDetailModal()">
      <div class="modal-content detail-modal" id="detailModal" (click)="$event.stopPropagation()" [style.left.px]="modalPositions['detailModal'].x" [style.top.px]="modalPositions['detailModal'].y">
        <div class="modal-header modal-drag-handle" (mousedown)="startDrag($event, 'detailModal')">
          <h3>💻 {{ selectedPC?.computer_name }} Details</h3>
          <button class="modal-close" (click)="closeDetailModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedPC">
          <div class="detail-grid">
            <div class="detail-item"><label>Computer Name:</label><span>{{ selectedPC.computer_name }}</span></div>
            <div class="detail-item"><label>User:</label><span>{{ selectedPC.user_name || '—' }}</span></div>
            <div class="detail-item"><label>Location:</label><span>{{ selectedPC.location || '—' }}</span></div>
            <div class="detail-item"><label>Department:</label><span>{{ selectedPC.department || '—' }}</span></div>
            <div class="detail-item"><label>IP Address:</label><code>{{ selectedPC.ip_address }}</code></div>
            <div class="detail-item"><label>MAC Address:</label><code>{{ selectedPC.mac_address || '—' }}</code></div>
            <div class="detail-item"><label>OS:</label><span>{{ selectedPC.os || '—' }} ({{ selectedPC.bit || '64' }}bit)</span></div>
            <div class="detail-item"><label>RAM:</label><span>{{ selectedPC.ram || '—' }}</span></div>
            <div class="detail-item"><label>Storage:</label><span>{{ selectedPC.storage || '—' }}</span></div>
            <div class="detail-item"><label>Processor:</label><span>{{ selectedPC.processor || '—' }}</span></div>
            <div class="detail-item"><label>Anti Virus:</label><span>{{ selectedPC.antivirus || '—' }}</span></div>
            <div class="detail-item"><label>MS License:</label><span>{{ selectedPC.ms_license_type || '—' }}</span></div>
            <div class="detail-item"><label>License Expiry:</label><span [class.expiring]="isExpiring(selectedPC)" [class.expired]="isExpired(selectedPC)">{{ selectedPC.license_expiry ? (selectedPC.license_expiry | date:'MMM d, yyyy') : '—' }}</span></div>
            <div class="detail-item"><label>Status:</label><span class="status-badge" [class]="'status-' + (selectedPC.status || 'unknown')">{{ selectedPC.status || 'unknown' }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cleaning Record Modal -->
    <div class="modal-overlay" *ngIf="showCleaningModal" (click)="closeCleaningModal()">
      <div class="modal-content" id="cleaningModal" (click)="$event.stopPropagation()" [style.left.px]="modalPositions['cleaningModal'].x" [style.top.px]="modalPositions['cleaningModal'].y">
        <div class="modal-header modal-drag-handle" (mousedown)="startDrag($event, 'cleaningModal')">
          <h3>🧹 {{ cleaningTarget ? 'Cleaning Record: ' + cleaningTarget.computer_name : 'New Cleaning Record' }}</h3>
          <button class="modal-close" (click)="closeCleaningModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Computer Name:</label>
            <input type="text" [(ngModel)]="cleaningForm.computer_name" class="form-input" [readonly]="!!cleaningTarget" placeholder="Computer name">
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Location:</label>
              <input type="text" [(ngModel)]="cleaningForm.location" class="form-input" placeholder="Location">
            </div>
            <div class="form-group half">
              <label>IP Address:</label>
              <input type="text" [(ngModel)]="cleaningForm.ip_address" class="form-input" placeholder="IP Address">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>OS:</label>
              <input type="text" [(ngModel)]="cleaningForm.os" class="form-input" placeholder="OS">
            </div>
            <div class="form-group half">
              <label>Architecture:</label>
              <select [(ngModel)]="cleaningForm.bit" class="form-input">
                <option value="32">32-bit</option>
                <option value="64">64-bit</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>RAM:</label>
              <select [(ngModel)]="cleaningForm.ram" class="form-input">
                <option value="">— Select RAM —</option>
                <option value="2 GB">2 GB</option>
                <option value="4 GB">4 GB</option>
                <option value="6 GB">6 GB</option>
                <option value="8 GB">8 GB</option>
                <option value="12 GB">12 GB</option>
                <option value="16 GB">16 GB</option>
                <option value="32 GB">32 GB</option>
                <option value="64 GB">64 GB</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Storage:</label>
              <select [(ngModel)]="cleaningForm.storage" class="form-input">
                <option value="">— Select Storage —</option>
                <option value="128 GB SSD">128 GB SSD</option>
                <option value="256 GB SSD">256 GB SSD</option>
                <option value="512 GB SSD">512 GB SSD</option>
                <option value="1 TB SSD">1 TB SSD</option>
                <option value="2 TB SSD">2 TB SSD</option>
                <option value="500 GB HDD">500 GB HDD</option>
                <option value="1 TB HDD">1 TB HDD</option>
                <option value="2 TB HDD">2 TB HDD</option>
                <option value="256 GB SSD + 1 TB HDD">256 GB SSD + 1 TB HDD</option>
                <option value="512 GB SSD + 1 TB HDD">512 GB SSD + 1 TB HDD</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Antivirus:</label>
              <select [(ngModel)]="cleaningForm.antivirus" class="form-input">
                <option value="">— Select Antivirus —</option>
                <option value="Trellix">Trellix</option>
                <option value="Windows Defender">Windows Defender</option>
                <option value="McAfee">McAfee</option>
                <option value="Norton">Norton</option>
                <option value="Kaspersky">Kaspersky</option>
                <option value="Bitdefender">Bitdefender</option>
                <option value="ESET">ESET</option>
                <option value="Avast">Avast</option>
                <option value="AVG">AVG</option>
                <option value="Trend Micro">Trend Micro</option>
                <option value="Sophos">Sophos</option>
                <option value="None">None</option>
              </select>
            </div>
            <div class="form-group half">
              <label>AV Last Update:</label>
              <input type="date" [(ngModel)]="cleaningForm.av_last_update" class="form-input">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Office Activation Date:</label>
              <input type="date" [(ngModel)]="cleaningForm.office_activation_date" class="form-input" (change)="calculateOfficeExpiry()">
            </div>
            <div class="form-group half">
              <label>Office Duration:</label>
              <select [(ngModel)]="cleaningForm.office_duration" class="form-input" (change)="calculateOfficeExpiry()">
                <option value="">— Select Duration —</option>
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
                <option value="24">2 Years</option>
                <option value="36">3 Years</option>
              </select>
            </div>
          </div>
          <div class="form-row" *ngIf="cleaningForm.office_expiry">
            <div class="form-group half">
              <label>Office Expiry Date:</label>
              <input type="date" [(ngModel)]="cleaningForm.office_expiry" class="form-input" readonly style="background-color: #f5f5f5;">
              <small class="hint-text">Auto-calculated from activation date + duration</small>
            </div>
            <div class="form-group half"></div>
          </div>
          <div class="form-group">
            <label>Cleaning Notes:</label>
            <textarea [(ngModel)]="cleaningForm.notes" class="form-input" rows="3" placeholder="Cleaning details, dust removal, thermal paste, etc."></textarea>
          </div>
          <div class="form-group">
            <label>Cleaning Date:</label>
            <input type="date" [(ngModel)]="cleaningForm.cleaning_date" class="form-input">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="closeCleaningModal()">Cancel</button>
          <button class="btn btn-primary" (click)="saveCleaningRecord()">💾 Save Record</button>
        </div>
      </div>
    </div>

    <!-- Cleaning History Modal -->
    <div class="modal-overlay" *ngIf="showCleaningHistory" (click)="closeCleaningHistory()">
      <div class="modal-content" id="cleaningHistoryModal" (click)="$event.stopPropagation()" [style.left.px]="modalPositions['cleaningHistoryModal'].x" [style.top.px]="modalPositions['cleaningHistoryModal'].y">
        <div class="modal-header modal-drag-handle" (mousedown)="startDrag($event, 'cleaningHistoryModal')">
          <h3>🧹 Cleaning History: {{ cleaningHistoryTarget?.computer_name }}</h3>
          <button class="modal-close" (click)="closeCleaningHistory()">✕</button>
        </div>
        <div class="modal-body">
          <div class="cleaning-filters" *ngIf="cleaningRecords.length > 0">
            <div class="filter-row">
              <div class="filter-group">
                <label>Month:</label>
                <select [(ngModel)]="cleaningFilterMonth" (change)="applyCleaningFilters()" class="form-input">
                  <option value="">All Months</option>
                  <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Year:</label>
                <select [(ngModel)]="cleaningFilterYear" (change)="applyCleaningFilters()" class="form-input">
                  <option value="">All Years</option>
                  <option *ngFor="let y of yearOptions" [value]="y">{{ y }}</option>
                </select>
              </div>
              <div class="filter-group filter-actions">
                <button class="btn" (click)="clearCleaningFilters()" *ngIf="cleaningFilterMonth || cleaningFilterYear">Clear Filters</button>
              </div>
            </div>
            <div class="filter-count" *ngIf="cleaningFilterMonth || cleaningFilterYear">
              Showing {{ filteredCleaningRecords.length }} of {{ cleaningRecords.length }} records
            </div>
          </div>
          
          <table class="mini-table" *ngIf="filteredCleaningRecords.length > 0">
            <thead>
              <tr>
                <th>Date</th>
                <th>AV Updated</th>
                <th>Antivirus</th>
                <th>Office Activation</th>
                <th>Office Expiry</th>
                <th>RAM</th>
                <th>Storage</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of filteredCleaningRecords">
                <td>{{ record.cleaning_date | date:'MMM d, yyyy' }}</td>
                <td>{{ record.av_last_update | date:'MMM yyyy' }}</td>
                <td>{{ record.antivirus || '—' }}</td>
                <td>
                  <span class="status-badge" [class.status-online]="record.office_activation === 'Activated'" [class.status-offline]="record.office_activation === 'Expired'">
                    {{ record.office_activation || '—' }}
                  </span>
                </td>
                <td>{{ record.office_expiry ? (record.office_expiry | date:'MMM yyyy') : '—' }}</td>
                <td>{{ record.ram || '—' }}</td>
                <td>{{ record.storage || '—' }}</td>
                <td>{{ record.notes || '—' }}</td>
                <td><button class="action-btn" (click)="deleteCleaningRecord(record)" title="Delete">🗑️</button></td>
              </tr>
            </tbody>
          </table>
          <div class="empty-row" *ngIf="filteredCleaningRecords.length === 0 && cleaningRecords.length > 0">No records found for the selected filter</div>
          <div class="empty-row" *ngIf="cleaningRecords.length === 0">No cleaning records found for this computer</div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="closeCleaningHistory()">Close</button>
          <button class="btn btn-primary" (click)="closeCleaningHistory(); openCleaningModal(cleaningHistoryTarget)">➕ New Record</button>
        </div>
      </div>
    </div>

    <!-- License Check Modal -->
    <div class="modal-overlay" *ngIf="showLicenseModal" (click)="closeLicenseModal()">
      <div class="modal-content" id="licenseModal" (click)="$event.stopPropagation()" [style.left.px]="modalPositions['licenseModal'].x" [style.top.px]="modalPositions['licenseModal'].y">
        <div class="modal-header modal-drag-handle" [class.license-expiring]="isExpiring(selectedPC)" [class.license-expired]="isExpired(selectedPC)" (mousedown)="startDrag($event, 'licenseModal')">
          <h3>🔍 License Status: {{ selectedPC?.computer_name }}</h3>
          <button class="modal-close" (click)="closeLicenseModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedPC">
          <div class="license-status-card">
            <div class="license-icon">{{ isExpired(selectedPC) ? '❌' : isExpiring(selectedPC) ? '⚠️' : '✅' }}</div>
            <h4>{{ isExpired(selectedPC) ? 'License Expired' : isExpiring(selectedPC) ? 'License Expiring Soon' : 'License Active' }}</h4>
            <div class="license-details">
              <div class="license-row"><span>Type:</span><strong>{{ selectedPC.ms_license_type || '—' }}</strong></div>
              <div class="license-row"><span>Expiry Date:</span><strong>{{ selectedPC.license_expiry | date:'fullDate' }}</strong></div>
              <div class="license-row"><span>Days Remaining:</span><strong [class.expiring]="isExpiring(selectedPC)" [class.expired]="isExpired(selectedPC)">{{ getDaysRemaining(selectedPC) <= 0 ? 'EXPIRED' : getDaysRemaining(selectedPC) + ' days' }}</strong></div>
            </div>
            <div class="countdown-bar"><div class="countdown-fill" [style.width.%]="getLicensePercentage(selectedPC)" [class.expiring]="isExpiring(selectedPC)" [class.expired]="isExpired(selectedPC)"></div></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="closeLicenseModal()">Close</button>
          <button class="btn btn-primary" (click)="closeLicenseModal(); editPC(selectedPC)">✏️ Update License</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
      <div class="modal-content confirm-modal" id="deleteModal" (click)="$event.stopPropagation()" [style.left.px]="modalPositions['deleteModal'].x" [style.top.px]="modalPositions['deleteModal'].y">
        <div class="modal-header modal-drag-handle" style="background: #cc0000;" (mousedown)="startDrag($event, 'deleteModal')">
          <h3>🗑️ Delete Computer</h3>
          <button class="modal-close" (click)="cancelDelete()">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-content">
            <span class="confirm-icon">⚠️</span>
            <p>Are you sure you want to delete <strong>{{ deleteTarget?.computer_name }}</strong>?</p>
            <p class="confirm-warning">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="cancelDelete()">Cancel</button>
          <button class="btn btn-delete" (click)="confirmDelete()">🗑️ Delete</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
      <span>{{ toastMessage }}</span>
    </div>
  `,
   styles: [`
    .monitoring-container{padding:16px;font-family:'Segoe UI',sans-serif;font-size:11px}
    .page-header{margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e0e0e0}
    .page-header h2{margin:0 0 2px 0;color:#0a246a;font-size:16px}
    .header-sub{color:#666;font-size:10px}
    .stats-bar{display:flex;gap:10px;margin-bottom:10px}
    .stat-item{flex:1;text-align:center;padding:8px;background:#fff;border:1px solid #c0c0c0;border-left:3px solid #0a246a}
    .stat-item.online{border-left-color:#008800}
    .stat-item.warning{border-left-color:#cc6600}
    .stat-item.danger{border-left-color:#cc0000}
    .stat-label{display:block;font-size:9px;text-transform:uppercase;color:#888}
    .stat-value{font-size:18px;font-weight:700;color:#333}
    .stat-value.office-warn{color:#cc6600}
    .stat-value.av-warn{color:#0066cc}
    .expiry-alert{background:#fff3cd;border:1px solid #ffc107;color:#856404;padding:8px 12px;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;font-size:11px}
    .alert-icon{font-size:16px;flex-shrink:0;margin-top:2px}
    .alert-messages{display:flex;flex-direction:column;gap:2px}
    .notification-bar{background:#f8f9fa;border:1px solid #d0d0d0;margin-bottom:10px;max-height:150px;overflow-y:auto}
    .notification-item{display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid #eee;font-size:10px}
    .notification-item.critical{background:#fff5f5}
    .notification-item.warning{background:#fffdf0}
    .notif-icon{flex-shrink:0}
    .notif-text{flex:1}
    .notif-close{background:none;border:none;cursor:pointer;color:#999;font-size:10px;padding:2px 4px}
    .notif-close:hover{color:#cc0000}
    .notif-toggle{width:100%;padding:4px;background:none;border:none;cursor:pointer;font-size:9px;color:#0a246a}
    .filter-bar{display:flex;gap:8px;align-items:center;padding:8px 10px;background:#f8f8f8;border:1px solid #c0c0c0;position:sticky;top:0;z-index:10}
    .table-container{background:#fff;border:1px solid #c0c0c0;overflow-y:auto;max-height:calc(100vh - 280px)}
    .data-table{width:100%;border-collapse:collapse}
    .data-table th{background:#f0f4f8;padding:8px 8px;font-size:9px;font-weight:700;text-transform:uppercase;color:#555;border-bottom:2px solid #d0d0d0;text-align:left;position:sticky;top:0;z-index:5;white-space:nowrap}
    .data-table td{padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;color:#333}
    .filter-input{padding:4px 8px;border:1px solid #c0c0c0;font-size:10px;width:160px}
    .filter-select{padding:4px 8px;border:1px solid #c0c0c0;font-size:10px}
    .btn{padding:4px 10px;border:1px solid #c0c0c0;background:#fff;cursor:pointer;font-size:9px}
    .btn-primary{background:#0a246a;color:#fff;border-color:#0a246a}
    .btn-primary:hover{background:#0a3a8c}
    .count-badge{margin-left:auto;color:#888;font-size:10px}
    .expiring-row{background:#fffdf0}
    .expired-row{background:#fff5f5}
    code{font-family:monospace;font-size:9px;background:#f5f5f5;padding:1px 4px}
    .status-badge{padding:1px 6px;font-size:8px;font-weight:600;text-transform:capitalize}
    .status-online{background:#eeffee;color:#008800}
    .status-offline{background:#ffecec;color:#cc0000}
    .status-unknown{background:#f0f0f0;color:#888}
    .location-badge{background:#e8f4fd;color:#0a246a;padding:1px 6px;font-size:9px;font-weight:500;white-space:nowrap}
    .license-badge{padding:1px 6px;font-size:8px;font-weight:600}
    .license-badge.active{background:#eeffee;color:#008800}
    .license-badge.expiring{background:#fffae8;color:#cc6600}
    .license-badge.expired{background:#ffecec;color:#cc0000}
    .expiry-cell{font-size:10px}
    .expiry-cell.expiring{color:#cc6600}
    .expiry-cell.expired{color:#cc0000}
    .countdown{font-size:8px;font-weight:bold;margin-top:1px}
    .expired-text{color:#cc0000}
    .expiring{color:#cc6600!important;font-weight:bold}
    .expired{color:#cc0000!important;font-weight:bold}
    .actions-cell{white-space:nowrap;display:flex;gap:2px}
    .action-btn{background:none;border:1px solid transparent;cursor:pointer;font-size:12px;padding:1px 4px}
    .action-btn:hover{background:#f0f0f0;border-color:#ccc}
    .action-btn.check:hover{background:#e8f0ff;border-color:#0a246a}
    .action-btn.clean:hover{background:#e8ffe8;border-color:#008800}
    .empty-row{text-align:center;padding:24px;color:#888}
    .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000}
    
    /* ✅ SINGLE modal-content rule with centering */
    .modal-content{background:#fff;width:90%;max-width:650px;max-height:85vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.3);position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)}
    
    /* ✅ When dragged (has inline left style), remove the transform centering */
    .modal-content[style*="left:"]{transform:none}
    
    .detail-modal{max-width:700px}
    .confirm-modal{max-width:380px}
    .modal-drag-handle{cursor:grab;user-select:none}
    .modal-drag-handle:active{cursor:grabbing}
    .modal-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#0a246a;color:#fff}
    .modal-header.license-expiring{background:#cc6600}
    .modal-header.license-expired{background:#cc0000}
    .modal-header h3{margin:0;font-size:13px}
    .modal-close{background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:16px;cursor:pointer;padding:2px 8px}
    .modal-body{padding:16px}
    .modal-footer{display:flex;justify-content:flex-end;gap:6px;padding:12px 16px;border-top:1px solid #e0e0e0;background:#f8f9fa}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .detail-item{padding:6px 10px;background:#f9f9f9}
    .detail-item label{display:block;font-size:8px;font-weight:600;color:#888;text-transform:uppercase;margin-bottom:1px}
    .detail-item span,.detail-item code{font-size:11px;color:#333}
    .form-row{display:flex;gap:10px}
    .form-group{margin-bottom:10px;flex:1}
    .form-group.half{flex:0.5}
    .form-group label{display:block;font-weight:600;font-size:10px;color:#555;margin-bottom:3px}
    .form-input{width:100%;padding:5px 8px;border:1px solid #c0c0c0;font-size:10px;box-sizing:border-box}
    textarea.form-input{resize:vertical}
    .license-status-card{text-align:center;padding:16px}
    .license-icon{font-size:40px;margin-bottom:6px}
    .license-status-card h4{margin:0 0 12px 0;color:#333}
    .license-details{text-align:left;background:#f9f9f9;padding:12px;margin-bottom:12px; color: #0f0e0e;}
    .license-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #423d3d;font-size:11px}
    .license-row:last-child{border-bottom:none}
    .countdown-bar{width:100%;height:10px;background:#e8e8e8;overflow:hidden}
    .countdown-fill{height:100%;background:#008800;transition:width 0.5s}
    .countdown-fill.expiring{background:#cc6600}
    .countdown-fill.expired{background:#cc0000}
    .toast-notification{position:fixed;bottom:20px;right:20px;background:#333;color:#fff;padding:8px 14px;transform:translateY(100px);opacity:0;transition:all 0.3s;z-index:3000;font-size:11px}
    .toast-notification.show{transform:translateY(0);opacity:1}
    .toast-notification.success{background:#008800}
    .toast-notification.error{background:#cc0000}
    .confirm-content{text-align:center}
    .confirm-icon{font-size:36px;display:block;margin-bottom:10px}
    .confirm-content p{font-size:11px;color:#333;margin:0 0 10px 0}
    .confirm-warning{color:#cc0000!important;font-size:9px!important;font-weight:600}
    .btn-delete{background:#cc0000;color:#fff;border:none;padding:4px 12px;cursor:pointer;font-size:9px}
    .btn-delete:hover{background:#aa0000}
    .hint-text{font-size:8px;color:#888;margin-top:3px;display:block}
    .cache-badge{font-size:9px;padding:1px 6px;cursor:help;white-space:nowrap}
    .cache-badge.from-cache{background:#fff8e1;color:#f57f17}
    .cache-badge.from-server{background:#e8f5e9;color:#2e7d32}
    .error-text{color:#cc0000;font-size:8px;margin-top:3px;display:block}
    .mini-table{width:100%;border-collapse:collapse;font-size:10px}
    .mini-table th{background:#f0f4f8;padding:5px 8px;text-align:left;font-size:9px;font-weight:700;border:1px solid #ddd; color: rgba(25, 29, 18, 0.88);}
    .mini-table td{padding:4px 8px;border:1px solid #eee; color: rgb(53, 23, 43);}
    .cleaning-filters{margin-bottom:12px;padding:10px;background:#f8f9fa;border:1px solid #e0e0e0}
    .filter-row{display:flex;gap:10px;align-items:flex-end}
    .filter-group{flex:0 0 auto}
    .filter-group label{display:block;font-size:9px;font-weight:600;color:#666;margin-bottom:2px}
    .filter-group .form-input{width:130px;padding:4px 8px;font-size:10px}
    .filter-actions{display:flex;align-items:flex-end;padding-bottom:1px}
    .filter-count{margin-top:6px;font-size:9px;color:#888;text-align:center}
    .action-btn.history:hover{background:#e8f0ff;border-color:#0a246a}
    .btn-back-all{background:#fff3e0;border-color:#ff9800;color:#e65100;animation:pulse 0.5s ease}
.btn-back-all:hover{background:#ffe0b2;border-color:#f57c00}
@keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
    /* Cleaning Records button */
.btn-cleaning {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
  position: relative;
}
.btn-cleaning:hover {
  background: #c8e6c9;
}
.btn-cleaning.active-filter {
  background: #4caf50;
  color: white;
  border-color: #388e3c;
}
.badge-count {
  background: #2e7d32;
  color: white;
  padding: 1px 5px;
  border-radius: 8px;
  font-size: 8px;
  margin-left: 4px;
}
.btn-cleaning.active-filter .badge-count {
  background: rgba(255,255,255,0.3);
}
  /* Back to All button */
.btn-back-all {
  background: #fff3e0;
  border-color: #ff9800;
  color: #e65100;
  animation: pulse 0.5s ease;
}
.btn-back-all:hover {
  background: #ffe0b2;
  border-color: #f57c00;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
  `]
})
export class ComputerMonitoringComponent implements OnInit, OnDestroy {
  pcs: any[] = [];
  filteredPCs: any[] = [];
  searchTerm = '';
  filterExpiry = 'all';
  filterLocation = 'all';
  showModal = false;
  showDetailModal = false;
  showLicenseModal = false;
  showCleaningModal = false;
  showCleaningHistory = false;
  showDeleteModal = false;
  editingPC: any = null;
  selectedPC: any = null;
  cleaningTarget: any = null;
  cleaningHistoryTarget: any = null;
  deleteTarget: any = null;
  cleaningRecords: any[] = [];
  departments: any[] = [];
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  showAllNotifications = false;
  notifications: any[] = [];
  private dismissedNotifications = new Set<string>();
   showCleanedOnly = false;  // ✅ NEW
  cleanedPCsCount = 0;      // ✅ NEW
  private allCleanedPCIds: Set<number> = new Set();  // ✅ NEW
  private apiUrl = environment.apiUrl;
  private cacheKey = 'computer_monitoring_cache_v2';
  private cacheExpiryKey = 'computer_monitoring_cache_expiry_v2';
  private CACHE_DURATION = 30 * 60 * 1000;
  isFromCache = false;
  originalIpAddress: string = '';
  ipDuplicateError: string = '';
  existingLocations: string[] = [];
  cleaningFilterMonth = '';
  cleaningFilterYear = '';
  filteredCleaningRecords: any[] = [];

  modalPositions: { [key: string]: { x: number; y: number } } = {};
  private isDragging = false;
  private dragTarget: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  
  formData: any = this.getEmptyFormData();
  cleaningForm: any = this.getEmptyCleaningForm();
  
  osList = ['Windows 7','Windows 7 Pro','Windows 8','Windows 8.1','Windows 10 Home','Windows 10 Pro','Windows 10 Enterprise','Windows 11 Home','Windows 11 Pro','Windows 11 Enterprise','Windows Server 2016','Windows Server 2019','Windows Server 2022','Linux - Ubuntu','Linux - CentOS','macOS'];
  
  licenseGroups = [
    {label:'Windows 10',options:['Windows 10 Home','Windows 10 Pro','Windows 10 Enterprise']},
    {label:'Windows 11',options:['Windows 11 Home','Windows 11 Pro','Windows 11 Enterprise']},
    {label:'Windows Server',options:['Windows Server 2012', 'Windows Server 2016','Windows Server 2019','Windows Server 2022']},
    {label:'Office',options:['Office 365 Business','Office 365 Enterprise','Microsoft 365 Business','Microsoft 365 Enterprise']},
    {label:'Other',options:['OEM License','Retail License','Volume License','None / Unlicensed']}
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFromCacheOrServer();
    this.loadDepartments();
    this.loadExistingLocations();
    this.loadDismissedNotifications();
    this.loadCleanedPCIds();
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showDetailModal) this.closeDetailModal();
    if (this.showLicenseModal) this.closeLicenseModal();
    if (this.showModal) this.closeModal();
    if (this.showCleaningModal) this.closeCleaningModal();
    if (this.showCleaningHistory) this.closeCleaningHistory();
    if (this.showDeleteModal) this.cancelDelete();
  }

  startDrag(event: MouseEvent, modalId: string) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    this.isDragging = true;
    this.dragTarget = modalId;
    const rect = modal.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    if (!this.modalPositions[modalId]) {
      this.modalPositions[modalId] = { x: rect.left, y: rect.top };
    }
    event.preventDefault();
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging || !this.dragTarget) return;
    this.modalPositions[this.dragTarget] = {
      x: event.clientX - this.dragOffsetX,
      y: event.clientY - this.dragOffsetY
    };
  }

  onDragEnd() {
    this.isDragging = false;
    this.dragTarget = null;
  }

  private generateNotifications() {
    this.notifications = [];
    this.pcs.forEach(pc => {
      const notifKey = `pc_${pc.id}`;
      const licenseDays = this.getDaysRemaining(pc);
      if (licenseDays <= 0 && pc.license_expiry && !this.dismissedNotifications.has(`${notifKey}_license_expired`)) {
        this.notifications.push({id: `${notifKey}_license_expired`, type: 'expired', message: `🔴 ${pc.computer_name}: MS License EXPIRED on ${new Date(pc.license_expiry).toLocaleDateString()}`, pc: pc});
      } else if (licenseDays <= 30 && licenseDays > 0 && !this.dismissedNotifications.has(`${notifKey}_license_expiring`)) {
        this.notifications.push({id: `${notifKey}_license_expiring`, type: 'expiring', message: `🟡 ${pc.computer_name}: MS License expires in ${licenseDays} days (${new Date(pc.license_expiry).toLocaleDateString()})`, pc: pc});
      }
      const officeDays = this.getOfficeDaysRemaining(pc);
      if (officeDays <= 0 && pc.office_expiry && !this.dismissedNotifications.has(`${notifKey}_office_expired`)) {
        this.notifications.push({id: `${notifKey}_office_expired`, type: 'expired', message: `🔴 ${pc.computer_name}: Office activation EXPIRED`, pc: pc});
      } else if (officeDays <= 30 && officeDays > 0 && !this.dismissedNotifications.has(`${notifKey}_office_expiring`)) {
        this.notifications.push({id: `${notifKey}_office_expiring`, type: 'expiring', message: `🟡 ${pc.computer_name}: Office activation expires in ${officeDays} days`, pc: pc});
      }
      if (pc.av_next_update) {
        const avDays = this.getDaysUntil(new Date(pc.av_next_update));
        if (avDays <= 0 && !this.dismissedNotifications.has(`${notifKey}_av_overdue`)) {
          this.notifications.push({id: `${notifKey}_av_overdue`, type: 'expired', message: `🔴 ${pc.computer_name}: Antivirus update OVERDUE`, pc: pc});
        } else if (avDays <= 14 && avDays > 0 && !this.dismissedNotifications.has(`${notifKey}_av_due`)) {
          this.notifications.push({id: `${notifKey}_av_due`, type: 'expiring', message: `🟡 ${pc.computer_name}: Antivirus update due in ${avDays} days`, pc: pc});
        }
      }
    });
    this.notifications.sort((a, b) => {const order: any = {expired: 0, expiring: 1, info: 2}; return order[a.type] - order[b.type];});
  }

  private loadDismissedNotifications() {
    const stored = localStorage.getItem('dismissed_computer_notifications');
    if (stored) {try {this.dismissedNotifications = new Set(JSON.parse(stored));} catch {this.dismissedNotifications = new Set();}}
  }

  private saveDismissedNotifications() {
    localStorage.setItem('dismissed_computer_notifications', JSON.stringify([...this.dismissedNotifications]));
  }

  dismissNotification(notif: any) {
    this.dismissedNotifications.add(notif.id);
    this.saveDismissedNotifications();
    this.notifications = this.notifications.filter(n => n.id !== notif.id);
  }

  getDaysUntil(date: Date): number {
    const today = new Date();
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  get officeExpiringCount(): number {return this.pcs.filter(pc => this.isOfficeExpiring(pc)).length;}
  
  get avUpdateCount(): number {
    return this.pcs.filter(pc => {if (!pc.av_next_update) return false; return this.getDaysUntil(new Date(pc.av_next_update)) <= 14;}).length;
  }

  isOfficeExpiring(pc: any): boolean {const days = this.getOfficeDaysRemaining(pc); return days > 0 && days <= 30;}
  isOfficeExpired(pc: any): boolean {return this.getOfficeDaysRemaining(pc) <= 0 && !!pc.office_expiry;}
  
  // Check if a date string is valid (not null, not '0000-00-00', not empty)
isValidDate(dateStr: any): boolean {
  if (!dateStr) return false;
  if (dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && d.getFullYear() > 1900;
}

// Check if office activation date is valid
isValidOfficeDate(pc: any): boolean {
  return this.isValidDate(pc.office_activation_date) || 
         pc.office_activation === 'Activated';
}
 getOfficeDaysRemaining(pc: any): number {
    if (!pc.office_expiry || pc.office_expiry === '0000-00-00' || pc.office_expiry === '') return Infinity;
    const expiry = new Date(pc.office_expiry);
    if (isNaN(expiry.getTime()) || expiry.getFullYear() < 2000) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

  getAVStatus(pc: any): string {
    if (!pc.av_next_update) return 'unknown';
    const days = this.getDaysUntil(new Date(pc.av_next_update));
    if (days <= 0) return 'offline';
    if (days <= 14) return 'warning';
    return 'online';
  }
// Add this method to load all computers that have cleaning records
loadCleanedPCIds() {
  const headers = this.getHeaders();
  
  this.http.get<any[]>(`${this.apiUrl}/api/computers/cleaning/all-ids`, { headers }).subscribe({
    next: (data) => {
      if (Array.isArray(data)) {
        this.allCleanedPCIds = new Set(data.map((item: any) => Number(item.computer_id)));
      }
      // ✅ Also merge with localStorage data
      this.mergeLocalCleaningIds();
      this.cleanedPCsCount = this.allCleanedPCIds.size;
      if (this.showCleanedOnly) {
        this.applyFilters();
      }
    },
    error: () => {
      // ✅ Load from localStorage on API error
      this.loadFromLocalStorage();
      if (this.showCleanedOnly) {
        this.applyFilters();
      }
    }
  });
}
private loadFromLocalStorage() {
  const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
  this.allCleanedPCIds = new Set(
    records
      .map((r: any) => Number(r.computer_id))
      .filter((id: number) => id && !isNaN(id))
  );
  this.cleanedPCsCount = this.allCleanedPCIds.size;
}
private mergeLocalCleaningIds() {
  const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
  records.forEach((r: any) => {
    const id = Number(r.computer_id);
    if (id && !isNaN(id)) {
      this.allCleanedPCIds.add(id);
    }
  });
  this.cleanedPCsCount = this.allCleanedPCIds.size;
}
 openCleaningModal(pc?: any) {
  this.cleaningTarget = pc || null;
  this.cleaningForm = this.getEmptyCleaningForm();
  if (pc) {
    this.cleaningForm = {
      computer_name: pc.computer_name || '', location: pc.location || '', ip_address: pc.ip_address || '',
      os: pc.os || '', bit: pc.bit || '64', ram: pc.ram || '', storage: pc.storage || '',
      antivirus: pc.antivirus || '', av_last_update: pc.av_last_update || '',
      office_activation_date: pc.office_activation_date || '', office_duration: pc.office_duration || '',
      office_expiry: pc.office_expiry || '', notes: '', cleaning_date: new Date().toISOString().split('T')[0]
    };
  }
  this.centerModal('cleaningModal'); // ✅ Center the modal
  this.showCleaningModal = true;
  this.showCleaningHistory = false;
}

  calculateExpiry() {
    if (this.formData.license_activation && this.formData.license_duration) {
      const activationDate = new Date(this.formData.license_activation);
      const months = parseInt(this.formData.license_duration);
      if (!isNaN(months)) {
        activationDate.setMonth(activationDate.getMonth() + months);
        this.formData.license_expiry = activationDate.toISOString().split('T')[0];
      }
    } else {this.formData.license_expiry = '';}
  }

  calculateOfficeExpiry() {
  if (this.cleaningForm.office_activation_date && this.cleaningForm.office_duration) {
    const activationDate = new Date(this.cleaningForm.office_activation_date);
    const months = parseInt(this.cleaningForm.office_duration);
    if (!isNaN(months)) {
      activationDate.setMonth(activationDate.getMonth() + months);
      this.cleaningForm.office_expiry = activationDate.toISOString().split('T')[0];
      // ✅ Auto-set office_activation status for cleaning form too
      const now = new Date();
      this.cleaningForm.office_activation = activationDate < now ? 'Expired' : 'Activated';
    }
  } else {
    this.cleaningForm.office_expiry = '';
  }
}
  closeCleaningModal() {this.showCleaningModal = false; this.cleaningTarget = null;}

 saveCleaningRecord() {
  const headers = this.getHeaders();
  const data = {...this.cleaningForm};
  
  if (this.cleaningTarget && this.cleaningTarget.id) {
    data.computer_id = this.cleaningTarget.id;
  }
  
  if (data.office_activation_date && data.office_expiry) {
    const now = new Date();
    const expiry = new Date(data.office_expiry);
    data.office_activation = expiry < now ? 'Expired' : 'Activated';
  } else if (data.office_activation_date) {
    data.office_activation = 'Activated';
  }
  
  this.http.post(`${this.apiUrl}/api/computers/cleaning`, data, {headers}).subscribe({
    next: (response: any) => {
      this.showCleaningModal = false;
      
      if (this.cleaningTarget) {
        const idx = this.pcs.findIndex(p => p.id === this.cleaningTarget!.id);
        if (idx >= 0) {
          // ✅ Update ALL fields including location and os
          this.pcs[idx].location = data.location || this.pcs[idx].location;
          this.pcs[idx].os = data.os || this.pcs[idx].os;
          this.pcs[idx].bit = data.bit || this.pcs[idx].bit;
          this.pcs[idx].ram = data.ram || this.pcs[idx].ram;
          this.pcs[idx].storage = data.storage || this.pcs[idx].storage;
          this.pcs[idx].antivirus = data.antivirus || this.pcs[idx].antivirus;
          this.pcs[idx].av_last_update = data.av_last_update || this.pcs[idx].av_last_update;
          this.pcs[idx].office_activation = data.office_activation;
          this.pcs[idx].office_activation_date = data.office_activation_date;
          this.pcs[idx].office_duration = data.office_duration;
          this.pcs[idx].office_expiry = data.office_expiry;
          
          this.saveToCache(this.pcs);
          this.applyFilters();
          this.generateNotifications();
        }
      }
      
      this.loadCleanedPCIds();
      this.showToastMsg('✅ Cleaning record saved!', 'success');
    },
    error: () => {
      const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
      data.id = Date.now();
      data.computer_id = this.cleaningTarget?.id || data.computer_id || null;
      records.push(data);
      localStorage.setItem('cleaning_records', JSON.stringify(records));
      
      if (this.cleaningTarget) {
        const idx = this.pcs.findIndex(p => p.id === this.cleaningTarget!.id);
        if (idx >= 0) {
          // ✅ Update ALL fields locally too
          this.pcs[idx].location = data.location || this.pcs[idx].location;
          this.pcs[idx].os = data.os || this.pcs[idx].os;
          this.pcs[idx].bit = data.bit || this.pcs[idx].bit;
          this.pcs[idx].ram = data.ram || this.pcs[idx].ram;
          this.pcs[idx].storage = data.storage || this.pcs[idx].storage;
          this.pcs[idx].antivirus = data.antivirus || this.pcs[idx].antivirus;
          this.pcs[idx].av_last_update = data.av_last_update || this.pcs[idx].av_last_update;
          this.pcs[idx].office_activation = data.office_activation || 'Activated';
          this.pcs[idx].office_activation_date = data.office_activation_date || '';
          this.pcs[idx].office_duration = data.office_duration || '';
          this.pcs[idx].office_expiry = data.office_expiry || '';
          
          this.saveToCache(this.pcs);
          this.applyFilters();
          this.generateNotifications();
        }
      }
      
      this.showCleaningModal = false;
      this.loadCleanedPCIds();
      this.showToastMsg('✅ Record saved locally', 'success');
    }
  });
}
 viewCleaningHistory(pc: any) {
  this.cleaningHistoryTarget = pc;
  this.cleaningFilterMonth = ''; this.cleaningFilterYear = '';
  this.filteredCleaningRecords = []; this.cleaningRecords = [];
  this.centerModal('cleaningHistoryModal'); // ✅ Center the modal
  this.loadCleaningRecords(pc);
  this.showCleaningHistory = true;
}

  get monthOptions(): {value: string, label: string}[] {
    return [
      {value:'1',label:'January'},{value:'2',label:'February'},{value:'3',label:'March'},
      {value:'4',label:'April'},{value:'5',label:'May'},{value:'6',label:'June'},
      {value:'7',label:'July'},{value:'8',label:'August'},{value:'9',label:'September'},
      {value:'10',label:'October'},{value:'11',label:'November'},{value:'12',label:'December'}
    ];
  }

  get yearOptions(): string[] {
    const y = new Date().getFullYear();
    return [y, y-1, y-2, y-3, y-4, y-5].map(String);
  }

  closeCleaningHistory() {this.showCleaningHistory = false; this.cleaningHistoryTarget = null;}

 loadCleaningRecords(pc: any, filterMonth?: string, filterYear?: string) {
  const headers = this.getHeaders();
  let url = `${this.apiUrl}/api/computers/cleaning/${pc.id}`;
  const params: string[] = [];
  if (filterMonth) params.push(`month=${filterMonth}`);
  if (filterYear) params.push(`year=${filterYear}`);
  if (params.length > 0) url += '?' + params.join('&');
  
  this.http.get<any[]>(url, {headers}).subscribe({
    next: (data) => {
      this.cleaningRecords = Array.isArray(data) ? data : [];
      // ✅ Merge with localStorage records for this computer
      this.mergeLocalCleaningRecords(pc);
      setTimeout(() => this.applyCleaningFilters(), 50);
    },
    error: () => {
      // ✅ Load from localStorage
      const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
      this.cleaningRecords = records.filter((r: any) => 
        r.computer_name === pc.computer_name || r.computer_id === pc.id
      );
      setTimeout(() => this.applyCleaningFilters(), 50);
    }
  });
}

// ✅ New helper method
private mergeLocalCleaningRecords(pc: any) {
  const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
  const localRecords = records.filter((r: any) => 
    r.computer_name === pc.computer_name || r.computer_id === pc.id
  );
  
  // Add local records that don't exist in the server response
  const existingIds = new Set(this.cleaningRecords.map((r: any) => Number(r.id)));
  localRecords.forEach((lr: any) => {
    if (!existingIds.has(Number(lr.id))) {
      this.cleaningRecords.push(lr);
    }
  });
}
  applyCleaningFilters() {
    let records = [...this.cleaningRecords];
    if (this.cleaningFilterMonth) {records = records.filter(r => {const d = new Date(r.cleaning_date); return (d.getMonth()+1).toString() === this.cleaningFilterMonth;});}
    if (this.cleaningFilterYear) {records = records.filter(r => {const d = new Date(r.cleaning_date); return d.getFullYear().toString() === this.cleaningFilterYear;});}
    records.sort((a,b) => new Date(b.cleaning_date).getTime() - new Date(a.cleaning_date).getTime());
    this.filteredCleaningRecords = records;
  }

  clearCleaningFilters() {this.cleaningFilterMonth = ''; this.cleaningFilterYear = ''; this.applyCleaningFilters();}

  deleteCleaningRecord(record: any) {
    if (!confirm('Delete this cleaning record?')) return;
    const headers = this.getHeaders();
    this.http.delete(`${this.apiUrl}/api/computers/cleaning/${record.id}`, {headers}).subscribe({
      next: () => {
        this.cleaningRecords = this.cleaningRecords.filter(r => r.id !== record.id);
        this.applyCleaningFilters();
        this.showToastMsg('Record deleted', 'success');
      },
      error: () => {
        const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
        localStorage.setItem('cleaning_records', JSON.stringify(records.filter((r: any) => r.id !== record.id)));
        this.cleaningRecords = this.cleaningRecords.filter(r => r.id !== record.id);
        this.applyCleaningFilters();
        this.loadCleanedPCIds();
        this.showToastMsg('Record deleted', 'success');
      }
    });
  }

  private getEmptyCleaningForm() {
    return {
      computer_name:'',location:'',ip_address:'',os:'',bit:'64',ram:'',storage:'',antivirus:'',av_last_update:'',
      office_activation_date:'',office_duration:'',office_expiry:'',notes:'',cleaning_date:new Date().toISOString().split('T')[0]
    };
  }

 private getEmptyFormData() {
  return {
    computer_name:'', user_name:'', location:'', ip_address:'', department:'',
    os:'', bit:'64', ram:'', storage:'', processor:'',
    antivirus:'', mac_address:'', ms_license_type:'',
    license_activation:'', license_duration:'', license_expiry:'',
    office_activation:'', office_activation_date:'', office_duration:'', office_expiry:'',
    av_last_update:'', av_next_update:''
  };
}

  private loadExistingLocations() {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.apiUrl}/api/computers/locations`, {headers}).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {this.existingLocations = response.filter((loc: string) => loc && loc.trim() !== '').sort();}
        else if (response?.locations) {this.existingLocations = response.locations.filter((loc: string) => loc && loc.trim() !== '').sort();}
      },
      error: () => this.extractLocationsFromPCs()
    });
  }

  private extractLocationsFromPCs() {
    const locations = this.pcs.map(pc => pc.location).filter((loc: string) => loc && loc.trim() !== '');
    this.existingLocations = [...new Set(locations)].sort();
  }

  private loadFromCacheOrServer() {
    const cachedData = this.getFromCache();
    if (cachedData && cachedData.length > 0) {
      this.pcs = cachedData; this.applyFilters(); this.extractLocationsFromPCs(); this.generateNotifications(); this.isFromCache = true;
    }
    this.loadPCsFromServer(true);
  }

  get uniqueLocations(): string[] {
    return [...new Set(this.pcs.map(pc => pc.location).filter((loc: string) => loc && loc.trim() !== ''))].sort();
  }

  get totalComputers(): number {return this.pcs.length;}
  get expiringCount(): number {return this.pcs.filter(pc => this.getDaysRemaining(pc) > 0 && this.getDaysRemaining(pc) <= 30).length;}
  get expiredCount(): number {return this.pcs.filter(pc => this.getDaysRemaining(pc) <= 0 && pc.license_expiry).length;}
  get onlineCount(): number {return this.pcs.filter(pc => pc.status === 'online').length;}

  getDaysRemaining(pc: any): number {
    if (!pc.license_expiry || pc.license_expiry === '0000-00-00' || pc.license_expiry === '') return Infinity;
    const expiry = new Date(pc.license_expiry);
    if (isNaN(expiry.getTime()) || expiry.getFullYear() < 2000) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

  getLicensePercentage(pc: any): number {
    if (!pc.license_expiry) return 100;
    const days = this.getDaysRemaining(pc);
    if (days <= 0) return 100;
    return Math.min(100, Math.max(0, (days / 365) * 100));
  }

  isExpiring(pc: any): boolean {const days = this.getDaysRemaining(pc); return days > 0 && days <= 30;}
  isExpired(pc: any): boolean {return this.getDaysRemaining(pc) <= 0 && !!pc.license_expiry;}
  getLicenseClass(pc: any): string {if (this.isExpired(pc)) return 'expired'; if (this.isExpiring(pc)) return 'expiring'; return 'active';}

  getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'};
  }

  loadDepartments() {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${this.apiUrl}/api/department-roles`, {headers}).subscribe({
      next: (data) => {
        const uniqueDepartments = new Map();
        if (Array.isArray(data)) {data.forEach(item => {if (item.department_name && !uniqueDepartments.has(item.department_name)) {uniqueDepartments.set(item.department_name, {name: item.department_name});}});}
        this.departments = Array.from(uniqueDepartments.values());
      },
      error: () => {}
    });
  }
filterCleanedPCs() {
  this.showCleanedOnly = !this.showCleanedOnly;
  this.applyFilters();
}
private loadPCsFromServer(silent: boolean = false) {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.apiUrl}/api/computers`, {headers}).subscribe({
      next: (response) => {
        let rawData: any[] = [];
        if (Array.isArray(response)) rawData = response;
        else if (response?.computers) rawData = response.computers;
        else if (response?.data) rawData = response.data;
        
        if (rawData.length > 0) {
          const existingMap = new Map();
          
          // ✅ Preserve existing local data first
          this.pcs.forEach(pc => { 
            if (pc.id) existingMap.set(Number(pc.id), pc); 
          });
          
          // ✅ Merge server data - but keep locally updated office fields if server has no value
          rawData.forEach((serverPC: any) => {
            const id = Number(serverPC.id);
            if (id) {
              const existing = existingMap.get(id);
              if (existing) {
                // ✅ Keep local office data if server doesn't have it
                serverPC.office_activation = serverPC.office_activation || existing.office_activation;
                serverPC.office_activation_date = serverPC.office_activation_date || existing.office_activation_date;
                serverPC.office_duration = serverPC.office_duration || existing.office_duration;
                serverPC.office_expiry = serverPC.office_expiry || existing.office_expiry;
                serverPC.av_last_update = serverPC.av_last_update || existing.av_last_update;
                serverPC.av_next_update = serverPC.av_next_update || existing.av_next_update;
              }
              existingMap.set(id, serverPC);
            }
          });
          
          this.pcs = Array.from(existingMap.values());
          this.saveToCache(this.pcs);
          this.extractLocationsFromPCs();
          this.generateNotifications();
          this.isFromCache = false;
        }
        this.applyFilters();
      },
      error: () => {
        if (this.pcs.length === 0) {
          const cachedData = this.getFromCache();
          if (cachedData && cachedData.length > 0) {
            this.pcs = cachedData;
            this.applyFilters();
            this.generateNotifications();
          }
        }
      }
    });
  }
// Calculate office expiry for the Add/Edit form
calculateOfficeExpiryForForm() {
  if (this.formData.office_activation_date && this.formData.office_duration) {
    const activationDate = new Date(this.formData.office_activation_date);
    const months = parseInt(this.formData.office_duration);
    if (!isNaN(months)) {
      activationDate.setMonth(activationDate.getMonth() + months);
      this.formData.office_expiry = activationDate.toISOString().split('T')[0];
      // Auto-set office_activation status
      const now = new Date();
      this.formData.office_activation = activationDate < now ? 'Expired' : 'Activated';
    }
  } else {
    this.formData.office_expiry = '';
  }
}

// Check if office is expired in the form
isOfficeExpiredForm(): boolean {
  if (!this.formData.office_expiry) return false;
  const expiry = new Date(this.formData.office_expiry);
  return expiry < new Date();
}
  checkIpDuplicate() {
    const ip = this.formData.ip_address;
    if (!ip) {this.ipDuplicateError = ''; return;}
    const existingPC = this.pcs.find(pc => pc.ip_address === ip && (!this.editingPC || pc.id !== this.editingPC.id));
    this.ipDuplicateError = existingPC ? `⚠️ IP ${ip} is already used by "${existingPC.computer_name}"` : '';
  }

  triggerScan() {
    const headers = this.getHeaders();
    this.showToastMsg('🔍 Starting network scan...', 'success');
    this.http.post(`${this.apiUrl}/api/computers/scan`, {}, {headers}).subscribe({
      next: () => {this.showToastMsg('Scan started!', 'success'); setTimeout(() => this.loadPCsFromServer(true), 10000);},
      error: () => this.showToastMsg('Scan service unavailable.', 'error')
    });
  }

  isCacheValid(): boolean {
    const expiry = localStorage.getItem(this.cacheExpiryKey);
    if (!expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  getFromCache(): any[] | null {
    if (!this.isCacheValid()) return null;
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return null;
    try {this.isFromCache = true; return JSON.parse(cached);} catch {return null;}
  }

  saveToCache(data: any[]) {
    if (!data || data.length === 0) return;
    try {localStorage.setItem(this.cacheKey, JSON.stringify(data)); localStorage.setItem(this.cacheExpiryKey, (Date.now() + this.CACHE_DURATION).toString());} catch {}
  }

  forceRefresh() {this.loadPCsFromServer(false); this.showToastMsg('🔄 Refreshing...', 'success');}

  savePC() {
  if (!this.formData.computer_name || !this.formData.ip_address) {
    this.showToastMsg('Computer Name and IP Address are required!', 'error'); return;
  }
  const headers = this.getHeaders();
  const url = this.editingPC 
    ? `${this.apiUrl}/api/computers/${this.editingPC.id}` 
    : `${this.apiUrl}/api/computers`;
  
  // ✅ Calculate office activation status before saving
  if (this.formData.office_activation_date && this.formData.office_expiry) {
    const now = new Date();
    const expiry = new Date(this.formData.office_expiry);
    this.formData.office_activation = expiry < now ? 'Expired' : 'Activated';
  } else if (this.formData.office_activation_date) {
    this.formData.office_activation = 'Activated';
  }
  
  const request = this.editingPC 
    ? this.http.put(url, this.formData, {headers}) 
    : this.http.post(url, this.formData, {headers});
  
  request.subscribe({
    next: () => {
      this.showModal = false;
      this.loadPCsFromServer(true);
      this.originalIpAddress = '';
      this.showToastMsg(this.editingPC ? '✅ PC updated!' : '✅ PC added!', 'success');
    },
    error: (err) => {
      this.showToastMsg(err.error?.sqlMessage?.includes('Duplicate entry') 
        ? '❌ IP already exists!' 
        : 'Failed to save.', 'error');
    }
  });
}
 deletePC(pc: any) {
  this.deleteTarget = pc;
  this.centerModal('deleteModal'); // ✅ Center the modal
  this.showDeleteModal = true;
}

  confirmDelete() {
    if (!this.deleteTarget) return;
    const headers = this.getHeaders();
    this.http.delete(`${this.apiUrl}/api/computers/${this.deleteTarget.id}`, {headers}).subscribe({
      next: () => {
        this.pcs = this.pcs.filter(p => p.id !== this.deleteTarget.id);
        this.saveToCache(this.pcs); this.extractLocationsFromPCs(); this.applyFilters(); this.generateNotifications();
        this.closeDeleteModal(); this.showToastMsg('✅ Computer deleted!', 'success');
      },
      error: () => {this.showToastMsg('Failed to delete', 'error'); this.closeDeleteModal();}
    });
  }

  cancelDelete() {this.closeDeleteModal();}
  closeDeleteModal() {this.showDeleteModal = false; this.deleteTarget = null;}

  applyFilters() {
  let filtered = [...this.pcs];
  
  // Search filter
  if (this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase();
    filtered = filtered.filter(pc => 
      pc.computer_name?.toLowerCase().includes(term) || 
      pc.ip_address?.toLowerCase().includes(term) || 
      pc.user_name?.toLowerCase().includes(term) || 
      pc.location?.toLowerCase().includes(term)
    );
  }
  
  // ✅ NEW: Show only cleaned PCs filter
  if (this.showCleanedOnly) {
    filtered = filtered.filter(pc => this.allCleanedPCIds.has(Number(pc.id)));
  }
  
  // Expiry filters
  if (this.filterExpiry === 'expiring') filtered = filtered.filter(pc => this.isExpiring(pc));
  else if (this.filterExpiry === 'expired') filtered = filtered.filter(pc => this.isExpired(pc));
  else if (this.filterExpiry === 'active') filtered = filtered.filter(pc => !this.isExpired(pc) && !this.isExpiring(pc));
  else if (this.filterExpiry === 'office') filtered = filtered.filter(pc => this.isOfficeExpiring(pc) || this.isOfficeExpired(pc));
  else if (this.filterExpiry === 'av') filtered = filtered.filter(pc => pc.av_next_update && this.getDaysUntil(new Date(pc.av_next_update)) <= 14);
  
  // Location filter
  if (this.filterLocation !== 'all') filtered = filtered.filter(pc => pc.location === this.filterLocation);
  
  // Sort by IP
  filtered.sort((a, b) => this.ipToNumber(a.ip_address) - this.ipToNumber(b.ip_address));
  this.filteredPCs = filtered;
}
  ipToNumber(ip: string): number {
    if (!ip) return 0;
    try {const p = ip.split('.'); if (p.length !== 4) return 0; return (+p[0]*16777216)+(+p[1]*65536)+(+p[2]*256)+(+p[3]);} catch {return 0;}
  }

 viewDetail(pc: any) {
  this.selectedPC = pc;
  this.centerModal('detailModal'); // ✅ Center the modal
  this.showDetailModal = true;
}
  closeDetailModal() {this.showDetailModal = false; this.selectedPC = null;}
  checkLicenseStatus(pc: any) {
  this.selectedPC = pc;
  this.centerModal('licenseModal'); // ✅ Center the modal
  this.showLicenseModal = true;
}
  closeLicenseModal() {this.showLicenseModal = false;}
private centerModal(modalId: string) {
  // Reset position to let CSS flexbox center it
  delete this.modalPositions[modalId];
}
  addPC() {
  this.editingPC = null; this.originalIpAddress = ''; this.ipDuplicateError = '';
  this.formData = this.getEmptyFormData();
  this.centerModal('editModal'); // ✅ Center the modal
  this.showModal = true;
}

 editPC(pc: any) {
  this.editingPC = pc; this.originalIpAddress = pc.ip_address; this.ipDuplicateError = '';
  this.formData = {
    computer_name:pc.computer_name||'', user_name:pc.user_name||'', location:pc.location||'',
    ip_address:pc.ip_address||'', department:pc.department||'', os:pc.os||'', bit:pc.bit||'64',
    ram:pc.ram||'', storage:pc.storage||'', processor:pc.processor||'',
    antivirus:pc.antivirus||'', mac_address:pc.mac_address||'',
    ms_license_type:pc.ms_license_type||'', license_activation:pc.license_activation||'',
    license_duration:pc.license_duration||'', license_expiry:pc.license_expiry||'',
    office_activation:pc.office_activation||'', 
    office_activation_date:pc.office_activation_date||'',
    office_duration:pc.office_duration||'',
    office_expiry:pc.office_expiry||'',
    av_last_update:pc.av_last_update||'', av_next_update:pc.av_next_update||''
  };
  this.centerModal('editModal');
  this.showModal = true;
}

  closeModal() {this.showModal = false; this.editingPC = null; this.ipDuplicateError = '';}

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}