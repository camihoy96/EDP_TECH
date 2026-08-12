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
  <!-- Search and basic filters - ALWAYS visible -->
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
  
  <!-- Cache badge - always visible -->
  <span class="cache-badge" [class.from-cache]="isFromCache" [class.from-server]="!isFromCache && pcs.length > 0" title="Data source indicator">
    {{ isFromCache ? '💾 Cached' : pcs.length > 0 ? '🌐 Live' : '' }}
  </span>

  <!-- Scan Network - only in normal mode -->
  <button class="btn btn-primary" *ngIf="!showCleanedOnly" (click)="triggerScan()">🔄 Scan Network</button>
  
  <!-- ✅ Cleaning Records toggle button - always visible -->
  <button class="btn btn-cleaning" (click)="filterCleanedPCs()" [class.active-filter]="showCleanedOnly" title="Show computers with cleaning records">
    🧹 Cleaning Records
    <span class="badge-count" *ngIf="cleanedPCsCount > 0">{{ cleanedPCsCount }}</span>
  </button>

  <!-- ✅ Show these when in cleaning-only mode -->
  <ng-container *ngIf="showCleanedOnly">
    <button class="btn btn-back-all" (click)="filterCleanedPCs()" title="Show all computers">
      📋 Show All Computers
    </button>
    
    <!-- ✅ Month filter -->
    <select [(ngModel)]="cleaningListFilterMonth" (change)="applyCleaningListFilters()" class="filter-select">
      <option value="">All Months</option>
      <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
    </select>
    
    <!-- ✅ Year filter -->
    <select [(ngModel)]="cleaningListFilterYear" (change)="applyCleaningListFilters()" class="filter-select">
      <option value="">All Years</option>
      <option *ngFor="let y of yearOptions" [value]="y">{{ y }}</option>
    </select>
    
    <button class="btn" (click)="clearCleaningListFilters()" *ngIf="cleaningListFilterMonth || cleaningListFilterYear">✕ Clear</button>
  </ng-container>

  <!-- Refresh and Add PC - only in normal mode -->
  <button class="btn" *ngIf="!showCleanedOnly" (click)="forceRefresh()" title="Force refresh from server">🔄 Refresh</button>
  <button class="btn" *ngIf="!showCleanedOnly" (click)="addPC()">➕ Add PC</button>
  
  <!-- New Cleaning - always visible -->
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
        <!-- ✅ Show Cleaning Date column when in cleaning mode -->
        <th *ngIf="showCleanedOnly">Cleaning Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let pc of filteredPCs" 
    [class.expiring-row]="isExpiring(pc) || isOfficeExpiring(pc)" 
    [class.expired-row]="isExpired(pc) || isOfficeExpired(pc)"
    [class.has-notification-row]="pc.hasWarning">
  
  <td>
    <strong>{{ pc.computer_name }}</strong>
    <!-- ✅ Show notification badge if this PC has active notifications -->
    <span *ngIf="pc.hasWarning" class="row-notif-badge" [title]="pc.activeNotifications[0]?.message">
      {{ pc.notificationCount > 1 ? '🔔×' + pc.notificationCount : '🔔' }}
    </span>
  </td>
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
        <td>
          <span class="license-badge" [class.active]="!isOfficeExpired(pc) && isValidOfficeDate(pc)" [class.expiring]="isOfficeExpiring(pc)" [class.expired]="isOfficeExpired(pc)">
            {{ isValidOfficeDate(pc) ? 'Activated' : (pc.office_activation === 'Expired' ? 'Expired' : 'N/A') }}
          </span>
          <div class="countdown" *ngIf="isValidDate(pc.office_activation_date)">
            <small>Since: {{ pc.office_activation_date | date:'MMM yyyy' }}</small>
          </div>
        </td>
        <td>
          <div class="expiry-cell" [class.expiring]="isOfficeExpiring(pc)" [class.expired]="isOfficeExpired(pc)">
            <strong>{{ isValidDate(pc.office_expiry) ? (pc.office_expiry | date:'MMM d, yyyy') : '—' }}</strong>
            <div class="countdown" *ngIf="getOfficeDaysRemaining(pc) <= 30 && getOfficeDaysRemaining(pc) > 0 && isValidDate(pc.office_expiry)">🔴 {{ getOfficeDaysRemaining(pc) }} days left</div>
            <div class="countdown expired-text" *ngIf="getOfficeDaysRemaining(pc) <= 0 && isValidDate(pc.office_expiry)">❌ EXPIRED</div>
          </div>
        </td>
        <td>
          <span class="status-badge" [class]="'status-' + getAVStatus(pc)">{{ pc.antivirus || 'N/A' }}</span>
          <div class="countdown" *ngIf="isValidDate(pc.av_last_update)">
            <small>Updated: {{ pc.av_last_update | date:'MMM yyyy' }}</small>
          </div>
        </td>
        <!-- ✅ Show last cleaning date for this PC -->
         <td *ngIf="showCleanedOnly">
  <span class="cleaning-date-badge">{{ getLastCleaningDate(pc.id) | date:'MMM d, yyyy' }}</span>
</td>
        <td><span class="status-badge" [class]="'staatus-' + (pc.status || 'unknown')">{{ pc.status || 'unknown' }}</span></td>
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
        <td [attr.colspan]="showCleanedOnly ? 14 : 12" class="empty-row">
          {{ pcs.length === 0 ? 'Loading computers...' : 'No computers found' }}
        </td>
      </tr>
    </tbody>
  </table>
</div>
    </div>

    <!-- Add/Edit Modal - Original format restored -->
    <div class="modal-overlay" *ngIf="showModal">
  <div class="modal-content" id="editModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['editModal'].x" 
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
  <div class="storage-add-row">
    <select [(ngModel)]="selectedStorageToAdd" class="form-input storage-dropdown">
      <option value="">— Select Storage —</option>
      <optgroup label="NVMe SSD">
        <ng-container *ngFor="let opt of storageOptions">
          <option *ngIf="opt.includes('NVMe')" [value]="opt">{{ opt }}</option>
        </ng-container>
      </optgroup>
      <optgroup label="SATA SSD">
        <ng-container *ngFor="let opt of storageOptions">
          <option *ngIf="opt.includes('SSD') && !opt.includes('NVMe')" [value]="opt">{{ opt }}</option>
        </ng-container>
      </optgroup>
      <optgroup label="HDD">
        <ng-container *ngFor="let opt of storageOptions">
          <option *ngIf="opt.includes('HDD') && !opt.includes('SSD') && !opt.includes('NVMe')" [value]="opt">{{ opt }}</option>
        </ng-container>
      </optgroup>
    </select>
    <button class="btn btn-primary storage-add-btn" (click)="addStorage()" [disabled]="!selectedStorageToAdd" title="Add Storage">+</button>
  </div>
  <!-- Selected storages -->
  <div class="selected-storages" *ngIf="selectedStorages.length > 0">
    <span class="storage-tag" *ngFor="let s of selectedStorages; let i = index">
      💾 {{ s }}
      <button class="storage-remove" (click)="removeStorage(i)">×</button>
    </span>
  </div>
  <small class="hint-text" *ngIf="selectedStorages.length === 0">Add one or more storage devices</small>
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
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="savePC()">{{ editingPC ? 'Update' : 'Save' }}</button>
        </div>
      </div>
    </div>

  <!-- Detail Modal -->
<div class="modal-overlay" *ngIf="showDetailModal">
  <div class="modal-content detail-modal" id="detailModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['detailModal'].x" 
       [style.top.px]="modalPositions['detailModal'].y">
    <div class="modal-header modal-drag-handle" (mousedown)="startDrag($event, 'detailModal')">
      <h3>💻 {{ selectedPC?.computer_name }} Details</h3>
      <button class="modal-close" (click)="closeDetailModal()">✕</button>
    </div>
    <div class="modal-body" *ngIf="selectedPC">
      <!-- Tab Navigation -->
      <div class="detail-tabs">
        <button class="tab-btn" [class.active]="detailTab === 'general'" (click)="detailTab = 'general'">📋 General</button>
        <button class="tab-btn" [class.active]="detailTab === 'license'" (click)="detailTab = 'license'">🔑 Licenses</button>
        <button class="tab-btn" [class.active]="detailTab === 'cleaning'" (click)="detailTab = 'cleaning'">🧹 Cleaning</button>
      </div>
      
      <!-- General Tab -->
      <div class="detail-grid" *ngIf="detailTab === 'general'">
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
        <div class="detail-item"><label>Status:</label><span class="status-badge" [class]="'status-' + (selectedPC.status || 'unknown')">{{ selectedPC.status || 'unknown' }}</span></div>
      </div>
      
      <!-- License Tab -->
      <div class="detail-grid" *ngIf="detailTab === 'license'">
        <div class="detail-item full-width"><label>MS License Type:</label><span class="license-badge" [class]="getLicenseClass(selectedPC)">{{ selectedPC.ms_license_type || '—' }}</span></div>
        <div class="detail-item"><label>License Activation:</label><span>{{ isValidDate(selectedPC.license_activation) ? (selectedPC.license_activation | date:'MMM d, yyyy') : '—' }}</span></div>
        <div class="detail-item"><label>License Duration:</label><span>{{ selectedPC.license_duration ? selectedPC.license_duration + ' months' : '—' }}</span></div>
        <div class="detail-item full-width">
          <label>License Expiry:</label>
          <span [class.expiring]="isExpiring(selectedPC)" [class.expired]="isExpired(selectedPC)">
            {{ isValidDate(selectedPC.license_expiry) ? (selectedPC.license_expiry | date:'MMM d, yyyy') : '—' }}
            <span *ngIf="isExpiring(selectedPC)" class="countdown">🔴 {{ getDaysRemaining(selectedPC) }} days left</span>
            <span *ngIf="isExpired(selectedPC)" class="countdown expired-text">❌ EXPIRED</span>
          </span>
        </div>
        
        <div class="detail-divider">📦 Microsoft Office</div>
        
        <div class="detail-item"><label>Office Status:</label>
          <span class="status-badge" [class.status-online]="!isOfficeExpired(selectedPC) && isValidDate(selectedPC.office_activation_date)" 
                [class.status-offline]="isOfficeExpired(selectedPC)">
            {{ isValidDate(selectedPC.office_activation_date) ? (isOfficeExpired(selectedPC) ? 'Expired' : 'Activated') : 'N/A' }}
          </span>
        </div>
        <div class="detail-item"><label>Office Activation Date:</label><span>{{ isValidDate(selectedPC.office_activation_date) ? (selectedPC.office_activation_date | date:'MMM d, yyyy') : '—' }}</span></div>
        <div class="detail-item"><label>Office Duration:</label><span>{{ selectedPC.office_duration ? selectedPC.office_duration + ' months' : '—' }}</span></div>
        <div class="detail-item full-width">
          <label>Office Expiry:</label>
          <span [class.expiring]="isOfficeExpiring(selectedPC)" [class.expired]="isOfficeExpired(selectedPC)">
            {{ isValidDate(selectedPC.office_expiry) ? (selectedPC.office_expiry | date:'MMM d, yyyy') : '—' }}
            <span *ngIf="isOfficeExpiring(selectedPC)" class="countdown">🔴 {{ getOfficeDaysRemaining(selectedPC) }} days left</span>
            <span *ngIf="isOfficeExpired(selectedPC)" class="countdown expired-text">❌ EXPIRED</span>
          </span>
        </div>
        
        <div class="detail-divider">🛡️ Antivirus</div>
        
        <div class="detail-item"><label>Antivirus:</label><span>{{ selectedPC.antivirus || '—' }}</span></div>
        <div class="detail-item"><label>AV Last Update:</label><span>{{ isValidDate(selectedPC.av_last_update) ? (selectedPC.av_last_update | date:'MMM d, yyyy') : '—' }}</span></div>
        <div class="detail-item"><label>AV Next Update:</label>
          <span [class.expiring]="isAVExpiring(selectedPC)" [class.expired]="isAVExpired(selectedPC)">
            {{ isValidDate(selectedPC.av_next_update) ? (selectedPC.av_next_update | date:'MMM d, yyyy') : '—' }}
            <span *ngIf="isAVExpiring(selectedPC)" class="countdown">🔴 Due soon</span>
            <span *ngIf="isAVExpired(selectedPC)" class="countdown expired-text">❌ OVERDUE</span>
          </span>
        </div>
      </div>
      
      <!-- Cleaning Tab -->
      <div *ngIf="detailTab === 'cleaning'">
        <div class="cleaning-summary" *ngIf="selectedPC">
          <div class="cleaning-stat">
            <span class="cleaning-stat-label">Last Cleaning:</span>
            <span class="cleaning-stat-value">{{ getLastCleaningDate(selectedPC.id) ? (getLastCleaningDate(selectedPC.id) | date:'MMM d, yyyy') : 'No records' }}</span>
          </div>
          <button class="btn btn-primary" (click)="openHistoryFromDetail(selectedPC)" style="margin-top: 8px;">
            📋 View Full History
          </button>
        </div>
        
        <div class="detail-grid" *ngIf="selectedPC">
          <div class="detail-item"><label>OS:</label><span>{{ selectedPC.os || '—' }} ({{ selectedPC.bit || '64' }}bit)</span></div>
          <div class="detail-item"><label>RAM:</label><span>{{ selectedPC.ram || '—' }}</span></div>
          <div class="detail-item"><label>Storage:</label><span>{{ selectedPC.storage || '—' }}</span></div>
          <div class="detail-item"><label>Processor:</label><span>{{ selectedPC.processor || '—' }}</span></div>
          <div class="detail-item"><label>Antivirus:</label><span>{{ selectedPC.antivirus || '—' }}</span></div>
          <div class="detail-item"><label>AV Last Update:</label><span>{{ isValidDate(selectedPC.av_last_update) ? (selectedPC.av_last_update | date:'MMM d, yyyy') : '—' }}</span></div>
          <div class="detail-item"><label>Office Status:</label>
            <span class="status-badge" [class.status-online]="!isOfficeExpired(selectedPC)" [class.status-offline]="isOfficeExpired(selectedPC)">
              {{ isValidDate(selectedPC.office_activation_date) ? (isOfficeExpired(selectedPC) ? 'Expired' : 'Activated') : 'N/A' }}
            </span>
          </div>
          <div class="detail-item"><label>Office Expiry:</label>
            <span [class.expiring]="isOfficeExpiring(selectedPC)" [class.expired]="isOfficeExpired(selectedPC)">
              {{ isValidDate(selectedPC.office_expiry) ? (selectedPC.office_expiry | date:'MMM d, yyyy') : '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" (click)="closeDetailModal()">Close</button>
      <button class="btn btn-av" (click)="updateAntivirus(selectedPC); closeDetailModal()">🛡️ Update AV</button>
      <button class="btn btn-primary" (click)="closeDetailModal(); editPC(selectedPC)">✏️ Edit</button>
      <button class="btn" (click)="closeDetailModal(); openCleaningModal(selectedPC)">🧹 New Cleaning</button>
    </div>
  </div>
</div>

    <!-- Cleaning Record Modal -->
    <div class="modal-overlay" *ngIf="showCleaningModal">
  <div class="modal-content" id="cleaningModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['cleaningModal'].x" 
       [style.top.px]="modalPositions['cleaningModal'].y">
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
  <label>Operating System:</label>
  <select [(ngModel)]="cleaningForm.os" class="form-input">
    <option value="">— Select OS —</option>
    <option *ngFor="let os of osList" [value]="os">{{ os }}</option>
  </select>
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
  <div class="storage-add-row">
    <select [(ngModel)]="selectedCleaningStorageToAdd" class="form-input storage-dropdown">
      <option value="">— Select Storage —</option>
      <optgroup label="NVMe SSD">
        <ng-container *ngFor="let opt of storageOptions">
          <option *ngIf="opt.includes('NVMe')" [value]="opt">{{ opt }}</option>
        </ng-container>
      </optgroup>
      <optgroup label="SATA SSD">
        <ng-container *ngFor="let opt of storageOptions">
          <option *ngIf="opt.includes('SSD') && !opt.includes('NVMe')" [value]="opt">{{ opt }}</option>
        </ng-container>
      </optgroup>
      <optgroup label="HDD">
        <ng-container *ngFor="let opt of storageOptions">
          <option *ngIf="opt.includes('HDD') && !opt.includes('SSD') && !opt.includes('NVMe')" [value]="opt">{{ opt }}</option>
        </ng-container>
      </optgroup>
    </select>
    <button class="btn btn-primary storage-add-btn" (click)="addCleaningStorage()" [disabled]="!selectedCleaningStorageToAdd" title="Add Storage">+</button>
  </div>
  <div class="selected-storages" *ngIf="selectedCleaningStorages.length > 0">
    <span class="storage-tag" *ngFor="let s of selectedCleaningStorages; let i = index">
      💾 {{ s }}
      <button class="storage-remove" (click)="removeCleaningStorage(i)">×</button>
    </span>
  </div>
  <small class="hint-text" *ngIf="selectedCleaningStorages.length === 0">Add one or more storage devices</small>
</div>
            <!-- ✅ ADD PROCESSOR FIELD -->
<div class="form-group">
  <label>Processor:</label>
  <input type="text" [(ngModel)]="cleaningForm.processor" class="form-input" placeholder="e.g., Intel Core i5-12400, AMD Ryzen 5">
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
    <div class="modal-overlay" *ngIf="showCleaningHistory">
  <div class="modal-content" id="cleaningHistoryModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['cleaningHistoryModal'].x" 
       [style.top.px]="modalPositions['cleaningHistoryModal'].y">
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
                <td><button class="action-btn" (click)="openDeleteCleaningModal(record)" title="Delete">🗑️</button></td>
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
    <div class="modal-overlay" *ngIf="showLicenseModal">
  <div class="modal-content" id="licenseModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['licenseModal'].x" 
       [style.top.px]="modalPositions['licenseModal'].y">
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
    <div class="modal-overlay" *ngIf="showDeleteModal">
  <div class="modal-content confirm-modal" id="deleteModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['deleteModal'].x" 
       [style.top.px]="modalPositions['deleteModal'].y">
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
     <!-- Delete Cleaning Record Confirmation Modal -->
<div class="modal-overlay" *ngIf="showDeleteCleaningModal">
  <div class="modal-content confirm-modal" id="deleteCleaningModal" (click)="$event.stopPropagation()" 
       [style.left.px]="modalPositions['deleteCleaningModal'].x" 
       [style.top.px]="modalPositions['deleteCleaningModal'].y">
    <div class="modal-header modal-drag-handle" style="background: #cc0000;" (mousedown)="startDrag($event, 'deleteCleaningModal')">
      <h3>🗑️ Delete Cleaning Record</h3>
      <button class="modal-close" (click)="cancelDeleteCleaning()">✕</button>
    </div>
    <div class="modal-body">
      <div class="confirm-content">
        <span class="confirm-icon">⚠️</span>
        <p>Are you sure you want to delete this cleaning record?</p>
        <p *ngIf="deleteCleaningTarget" class="confirm-detail">
          <strong>{{ deleteCleaningTarget.computer_name }}</strong><br>
          <small>Date: {{ deleteCleaningTarget.cleaning_date | date:'MMM d, yyyy' }}</small>
        </p>
        <p class="confirm-warning">This action cannot be undone.</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" (click)="cancelDeleteCleaning()">Cancel</button>
      <button class="btn btn-delete" (click)="confirmDeleteCleaning()">🗑️ Delete</button>
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
    .notification-item{display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid #eee;font-size:10px; color: rgb(36, 31, 13);}
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
  font-size: 11px;
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
  .cleaning-date-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
  /* Detail Modal Tabs */
.detail-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0;
}

.tab-btn {
  padding: 6px 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 11px;
  color: #888;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #0a246a;
  background: #f0f4f8;
}

.tab-btn.active {
  color: #0a246a;
  border-bottom-color: #0a246a;
  font-weight: 600;
}

/* Full width detail item */
.detail-item.full-width {
  grid-column: 1 / -1;
}

/* Detail divider */
.detail-divider {
  grid-column: 1 / -1;
  padding: 8px 0;
  margin: 4px 0;
  font-weight: 700;
  font-size: 11px;
  color: #0a246a;
  border-bottom: 1px solid #e0e0e0;
}

/* Cleaning Summary in Detail Modal */
.cleaning-summary {
  background: #f0f8f0;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  text-align: center;
}

.cleaning-stat {
  margin-bottom: 4px;
}

.cleaning-stat-label {
  font-size: 11px;
  color: #666;
  display: block;
}

.cleaning-stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #2e7d32;
}
  .btn-av {
  background: #0066cc;
  color: #fff;
  border-color: #0055aa;
}
.btn-av:hover {
  background: #0055aa;
}
  /* Row with active notification */
.has-notification-row {
  border-left: 3px solid #ff9800 !important;
  background: #fff8e1 !important;
}

.has-notification-row.expiring-row {
  border-left: 3px solid #cc6600 !important;
  background: #fff3e0 !important;
}

.has-notification-row.expired-row {
  border-left: 3px solid #cc0000 !important;
  background: #ffebee !important;
}

/* Notification badge in the computer name cell */
.row-notif-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 12px;
  cursor: help;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* Tooltip-style hover effect */
.row-notif-badge:hover {
  transform: scale(1.3);
}
  .confirm-detail {
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 0;
  font-size: 11px;
  color: #333;
  text-align: center;
}
.confirm-detail strong {
  display: block;
  font-size: 12px;
  margin-bottom: 2px;
}
.confirm-detail small {
  color: #888;
}
  .storage-multi-select {
  border: 1px solid #c0c0c0;
  background: #fafafa;
  padding: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.storage-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.storage-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 10px;
  color: #333;
  border-radius: 2px;
}

.storage-checkbox:hover {
  background: #e8f0fe;
}

.storage-checkbox input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #0a246a;
  flex-shrink: 0;
}

.storage-checkbox span {
  flex: 1;
  line-height: 1.3;
}

.selected-storages {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.storage-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid #c8e6c9;
}

.storage-remove {
  background: none;
  border: none;
  color: #cc0000;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;
}

.storage-remove:hover {
  color: #ff0000;
}
  .storage-add-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.storage-dropdown {
  flex: 1;
  min-width: 0;
}

.storage-add-btn {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
}

.storage-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  cleaningListFilterMonth = '';
  cleaningListFilterYear = '';
  allCleaningRecordsForFilter: any[] = []; 
  detailTab: string = 'general';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  showAllNotifications = false;
  notifications: any[] = [];
  private dismissedNotifications = new Set<string>();
   showCleanedOnly = false;  // ✅ NEW
  cleanedPCsCount = 0;      // ✅ NEW
  private allCleanedPCIds: Set<number> = new Set();  // ✅ NEW
  private apiUrl = environment.apiUrl;
  private cacheKey = 'computer_monitoring_cache_v3';
  private cacheExpiryKey = 'computer_monitoring_cache_expiry_v3';
  private CACHE_DURATION = 5 * 60 * 1000;
  isFromCache = false;
  originalIpAddress: string = '';
  ipDuplicateError: string = '';
  existingLocations: string[] = [];
  cleaningFilterMonth = '';
  cleaningFilterYear = '';
  filteredCleaningRecords: any[] = [];
  showDeleteCleaningModal = false;
  deleteCleaningTarget: any = null;
  modalPositions: { [key: string]: { x: number; y: number } } = {};
  private isDragging = false;
  private dragTarget: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
storageOptions = [
  // NVMe SSDs
  '128 GB NVMe SSD', '256 GB NVMe SSD', '512 GB NVMe SSD', 
  '1 TB NVMe SSD', '2 TB NVMe SSD',
  
  // SATA SSDs
  '128 GB SSD', '256 GB SSD', '512 GB SSD', 
  '1 TB SSD', '2 TB SSD',
  
  // HDDs
  '160 GB HDD', '250 GB HDD', '320 GB HDD', 
  '500 GB HDD', '1 TB HDD', '2 TB HDD'
];
selectedStorageToAdd: string = '';
selectedCleaningStorageToAdd: string = '';
selectedStorages: string[] = [];
selectedCleaningStorages: string[] = [];
  formData: any = this.getEmptyFormData();
  cleaningForm: any = this.getEmptyCleaningForm();
  
  osList = ['Windows 7','Windows 7 Pro','Windows 8','Windows 8.1','Windows 10 Home','Windows 10 Pro','Windows 10 Enterprise','Windows 11 Home','Windows 11 Pro','Windows 11 Enterprise', 'Windows Server 2012','Windows Server 2016','Windows Server 2019','Windows Server 2022','Linux - Ubuntu','Linux - CentOS','macOS'];
  
  licenseGroups = [
    {label:'Windows 10',options:['Windows 10 Home','Windows 10 Pro','Windows 10 Enterprise']},
    {label:'Windows 11',options:['Windows 11 Home','Windows 11 Pro','Windows 11 Enterprise']},
    {label:'Windows Server',options:['Windows Server 2012', 'Windows Server 2016','Windows Server 2019','Windows Server 2022']},
    {label:'Office',options:['Office 365 Business','Office 365 Enterprise','Microsoft 365 Business','Microsoft 365 Enterprise']},
    {label:'Other',options:['OEM License','Retail License', 'Microsoft Office 2010', 'Microsoft Office 2019', 'Microsoft Office 2021','Volume License','None / Unlicensed']}
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
  
addStorage() {
  if (this.selectedStorageToAdd && this.selectedStorageToAdd.trim()) {
    this.selectedStorages.push(this.selectedStorageToAdd.trim());
    this.formData.storage = this.selectedStorages.join(', ');
    this.selectedStorageToAdd = ''; // Reset dropdown
  }
}

removeStorage(index: number) {
  this.selectedStorages.splice(index, 1);
  this.formData.storage = this.selectedStorages.join(', ');
}

// ✅ ADD STORAGE - Cleaning form
addCleaningStorage() {
  if (this.selectedCleaningStorageToAdd && this.selectedCleaningStorageToAdd.trim()) {
    this.selectedCleaningStorages.push(this.selectedCleaningStorageToAdd.trim());
    this.cleaningForm.storage = this.selectedCleaningStorages.join(', ');
    this.selectedCleaningStorageToAdd = ''; // Reset dropdown
  }
}

removeCleaningStorage(index: number) {
  this.selectedCleaningStorages.splice(index, 1);
  this.cleaningForm.storage = this.selectedCleaningStorages.join(', ');
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
      this.mergeLocalCleaningIds();
      this.cleanedPCsCount = this.allCleanedPCIds.size;
      
      // ✅ Only apply filters if NOT in cleaning mode
      // (cleaning mode has its own data loading)
      if (!this.showCleanedOnly) {
        this.applyFilters();
      }
    },
    error: () => {
      this.loadFromLocalStorage();
      if (!this.showCleanedOnly) {
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
  
  // ✅ Reset cleaning storages when no PC selected
  if (!pc) {
    this.selectedCleaningStorages = [];
  }
  
  if (pc) {
    const latestPC = this.pcs.find(p => p.id === pc.id) || pc;
    
    const osValue = latestPC.os || pc.os || '';
    if (osValue && !this.osList.includes(osValue)) {
      this.osList.push(osValue);
    }
    
    // ✅ Populate cleaning storages
    if (latestPC.storage) {
      this.selectedCleaningStorages = latestPC.storage.split(',').map((s: string) => s.trim());
      this.cleaningForm.storage = latestPC.storage;
    } else {
      this.selectedCleaningStorages = [];
    }
    
    this.cleaningForm = {
      computer_name: latestPC.computer_name || pc.computer_name || '',
      location: latestPC.location || pc.location || '',
      ip_address: latestPC.ip_address || pc.ip_address || '',
      os: osValue,
      bit: latestPC.bit || pc.bit || '64',
      ram: latestPC.ram || pc.ram || '',
      storage: latestPC.storage || pc.storage || '',
      processor: latestPC.processor || pc.processor || '',
      antivirus: latestPC.antivirus || pc.antivirus || '',
      av_last_update: this.formatDate(latestPC.av_last_update || pc.av_last_update),
      office_activation_date: this.formatDate(latestPC.office_activation_date || pc.office_activation_date),
      office_duration: latestPC.office_duration || pc.office_duration || '',
      office_expiry: this.formatDate(latestPC.office_expiry || pc.office_expiry),
      notes: '',
      cleaning_date: new Date().toISOString().split('T')[0]
    };
  }
  
  this.centerModal('cleaningModal');
  this.showCleaningModal = true;
  this.showCleaningHistory = false;
}
// ✅ Helper to format dates properly
private formatDate(dateStr: any): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00' || dateStr === 'null' || dateStr === 'undefined') return '';
  // If it's a Date object, convert to string
  if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
    return dateStr.toISOString().split('T')[0];
  }
  // If it's already a valid date string, return it
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr.split('T')[0];
  }
  // Try parsing it
  const d = new Date(dateStr);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
    return d.toISOString().split('T')[0];
  }
  return '';
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
          this.pcs[idx].location = data.location || this.pcs[idx].location;
          this.pcs[idx].os = data.os || this.pcs[idx].os;
          this.pcs[idx].bit = data.bit || this.pcs[idx].bit;
          this.pcs[idx].ram = data.ram || this.pcs[idx].ram;
          this.pcs[idx].storage = data.storage || this.pcs[idx].storage;
          this.pcs[idx].processor = data.processor || this.pcs[idx].processor;
          this.pcs[idx].antivirus = data.antivirus || this.pcs[idx].antivirus;
          this.pcs[idx].av_last_update = data.av_last_update || this.pcs[idx].av_last_update;
          this.pcs[idx].office_activation = data.office_activation;
          this.pcs[idx].office_activation_date = data.office_activation_date;
          this.pcs[idx].office_duration = data.office_duration;
          this.pcs[idx].office_expiry = data.office_expiry;
          
          this.saveToCache(this.pcs);
          this.generateNotifications();
        }
      }
      
      // ✅ Reload cleaning data to update counts and dates
      if (this.showCleanedOnly) {
        // If in cleaning mode, reload everything
        this.loadAllCleaningData();
      } else {
        // Otherwise just update the badge count
        this.loadCleanedPCIds();
      }
      
      this.showToastMsg('✅ Cleaning record saved!', 'success');
    },
    error: () => {
      // Local fallback
      const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
      data.id = Date.now();
      data.computer_id = this.cleaningTarget?.id || data.computer_id || 0;
      data.cleaning_date = data.cleaning_date || new Date().toISOString().split('T')[0];
      records.push(data);
      localStorage.setItem('cleaning_records', JSON.stringify(records));
      
      if (this.cleaningTarget) {
        const idx = this.pcs.findIndex(p => p.id === this.cleaningTarget!.id);
        if (idx >= 0) {
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
          this.generateNotifications();
        }
      }
      
      this.showCleaningModal = false;
      
      if (this.showCleanedOnly) {
        this.loadAllCleaningData();
      } else {
        this.loadCleanedPCIds();
      }
      
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
applyCleaningListFilters() {
  if (!this.showCleanedOnly) return;
  this.loadAllCleaningRecordsForFilter();
}

loadAllCleaningRecordsForFilter() {
  const hasFilter = this.cleaningListFilterMonth || this.cleaningListFilterYear;
  
  if (!hasFilter) {
    // ✅ No filters selected - show ALL cleaned PCs
    this.loadCleanedPCIds();
    return;
  }
  
  // ✅ First try from localStorage (fast, always works)
  const localRecords = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
  
  let filteredIds: Set<number> = new Set();
  
  localRecords.forEach((r: any) => {
    if (!r.cleaning_date || !r.computer_id) return;
    const date = new Date(r.cleaning_date);
    const month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    
    let include = true;
    if (this.cleaningListFilterMonth && month !== this.cleaningListFilterMonth) include = false;
    if (this.cleaningListFilterYear && year !== this.cleaningListFilterYear) include = false;
    
    if (include) {
      filteredIds.add(Number(r.computer_id));
    }
  });
  
  // ✅ Also try backend with month/year filter
  const headers = this.getHeaders();
  let url = `${this.apiUrl}/api/computers/cleaning/all-dates`;
  const params: string[] = [];
  if (this.cleaningListFilterMonth) params.push(`month=${this.cleaningListFilterMonth}`);
  if (this.cleaningListFilterYear) params.push(`year=${this.cleaningListFilterYear}`);
  if (params.length > 0) url += '?' + params.join('&');
  
  this.http.get<any[]>(url, { headers }).subscribe({
    next: (data) => {
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const computerId = Number(item.computer_id);
          if (computerId && !isNaN(computerId)) {
            filteredIds.add(computerId);
          }
        });
      }
      
      // Apply the filtered results
      this.allCleanedPCIds = filteredIds;
      this.cleanedPCsCount = filteredIds.size;
      this.applyFilters();
    },
    error: () => {
      // Backend failed, use localStorage results only
      this.allCleanedPCIds = filteredIds;
      this.cleanedPCsCount = filteredIds.size;
      this.applyFilters();
    }
  });
}

clearCleaningListFilters() {
  this.cleaningListFilterMonth = '';
  this.cleaningListFilterYear = '';
  // Reload all cleaned PC IDs
  this.loadCleanedPCIds();
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
  // Open the delete confirmation modal
openDeleteCleaningModal(record: any) {
  this.deleteCleaningTarget = record;
  this.centerModal('deleteCleaningModal');
  this.showDeleteCleaningModal = true;
}

// Cancel deletion
cancelDeleteCleaning() {
  this.showDeleteCleaningModal = false;
  this.deleteCleaningTarget = null;
}

// Confirm and execute deletion
confirmDeleteCleaning() {
  if (!this.deleteCleaningTarget) return;
  
  const record = this.deleteCleaningTarget;
  const headers = this.getHeaders();
  
  this.http.delete(`${this.apiUrl}/api/computers/cleaning/${record.id}`, { headers }).subscribe({
    next: () => {
      this.cleaningRecords = this.cleaningRecords.filter(r => r.id !== record.id);
      this.applyCleaningFilters();
      
      if (this.showCleanedOnly) {
        this.loadAllCleaningData();
      } else {
        this.loadCleanedPCIds();
      }
      
      this.showDeleteCleaningModal = false;
      this.deleteCleaningTarget = null;
      this.showToastMsg('✅ Record deleted', 'success');
    },
    error: () => {
      const records = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
      localStorage.setItem('cleaning_records', JSON.stringify(records.filter((r: any) => r.id !== record.id)));
      this.cleaningRecords = this.cleaningRecords.filter(r => r.id !== record.id);
      this.applyCleaningFilters();
      
      if (this.showCleanedOnly) {
        this.loadAllCleaningData();
      } else {
        this.loadCleanedPCIds();
      }
      
      this.showDeleteCleaningModal = false;
      this.deleteCleaningTarget = null;
      this.showToastMsg('✅ Record deleted', 'success');
    }
  });
}

// Keep this for backward compatibility or remove it
deleteCleaningRecord(record: any) {
  this.openDeleteCleaningModal(record);
}
private getEmptyCleaningForm() {
  return {
    computer_name:'',location:'',ip_address:'',os:'',bit:'64',ram:'',storage:'',processor:'',
    antivirus:'',av_last_update:'',
    office_activation_date:'',office_duration:'',office_expiry:'',notes:'',
    cleaning_date:new Date().toISOString().split('T')[0]
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
  // ✅ Load cache instantly first
  const cachedData = this.getFromCache();
  if (cachedData && cachedData.length > 0) {
    this.pcs = cachedData;
    this.applyFilters();
    this.extractLocationsFromPCs();
    this.generateNotifications();
    this.isFromCache = true;
    console.log('📦 Loaded from cache:', cachedData.length, 'computers');
  }
  
  // ✅ Then fetch fresh data from server (without clearing cache first)
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
  if (this.showCleanedOnly) {
    this.cleaningListFilterMonth = '';
    this.cleaningListFilterYear = '';
    // ✅ Load both IDs AND dates
    this.loadAllCleaningData();
  } else {
    // ✅ When going back to all computers, don't reload - just apply filters
    this.applyFilters();
  }
}
loadAllCleaningData() {
  const headers = this.getHeaders();
  const url = `${this.apiUrl}/api/computers/cleaning/all-records`;
  
  console.log('🔍 Calling all-records API:', url);
  console.log('🔍 Headers:', headers);
  
  this.http.get<any[]>(url, { headers }).subscribe({
    next: (data) => {
      console.log('✅ Raw API response:', data);
      console.log('✅ Response type:', typeof data, 'Is array:', Array.isArray(data));
      
      if (Array.isArray(data) && data.length > 0) {
        this.allCleaningRecordsForFilter = data;
        
        // Merge localStorage
        const localRecords = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
        localRecords.forEach((lr: any) => {
          const exists = this.allCleaningRecordsForFilter.some(
            (existing: any) => Number(existing.id) === Number(lr.id)
          );
          if (!exists) {
            this.allCleaningRecordsForFilter.push(lr);
          }
        });
        
        // Build sets
        const cleanedIds = new Set<number>();
        const cleanedNames = new Set<string>();
        
        this.allCleaningRecordsForFilter.forEach((r: any) => {
          if (r.computer_id) cleanedIds.add(Number(r.computer_id));
          if (r.computer_name) cleanedNames.add(r.computer_name.toLowerCase().trim());
        });
        
        console.log('🔢 Cleaned IDs:', [...cleanedIds]);
        console.log('📛 Cleaned Names:', [...cleanedNames]);
        
        // Match pcs
        this.allCleanedPCIds = new Set<number>();
        this.pcs.forEach(pc => {
          const pcId = Number(pc.id);
          const pcName = (pc.computer_name || '').toLowerCase().trim();
          if (cleanedIds.has(pcId) || cleanedNames.has(pcName)) {
            this.allCleanedPCIds.add(pcId);
          }
        });
        
        this.cleanedPCsCount = this.allCleanedPCIds.size;
        console.log('✅ Final count:', this.cleanedPCsCount);
      } else {
        console.warn('⚠️ No data returned, falling back');
        this.loadFromLocalStorage();
      }
      this.applyFilters();
    },
    error: (err) => {
      console.error('❌ API Error:', err.status, err.statusText, err.message);
      console.error('❌ Full error:', err);
      // Fallback to localStorage
      this.loadFromLocalStorage();
      this.applyFilters();
    }
  });
}
// ✅ Add this helper method
private mergeLocalCleaningRecordsForAll() {
  // This is now handled inline in loadAllCleaningData
}

// ✅ New method: Load both PC IDs and dates, then apply filters
loadCleanedPCIdsAndDates() {
  const headers = this.getHeaders();
  
  // First load the PC IDs
  this.http.get<any[]>(`${this.apiUrl}/api/computers/cleaning/all-ids`, { headers }).subscribe({
    next: (data) => {
      if (Array.isArray(data)) {
        this.allCleanedPCIds = new Set(data.map((item: any) => Number(item.computer_id)));
      }
      this.mergeLocalCleaningIds();
      this.cleanedPCsCount = this.allCleanedPCIds.size;
      
      // ✅ Now load the dates
      this.loadAllCleaningRecordsForDates();
    },
    error: () => {
      this.loadFromLocalStorage();
      // ✅ Still load dates even if IDs fail
      this.loadAllCleaningRecordsForDates();
    }
  });
}
getLastCleaningDate(computerId: number): string | null {
  if (!computerId || isNaN(computerId)) {
    return null;
  }
  
  const numId = Number(computerId);
  let latestDate: string | null = null;
  let latestDateObj: Date | null = null;
  
  // Check all records from the API (these have id, computer_id, cleaning_date)
  if (this.allCleaningRecordsForFilter && this.allCleaningRecordsForFilter.length > 0) {
    for (const record of this.allCleaningRecordsForFilter) {
      // ✅ Convert both to numbers for comparison
      const recordCompId = Number(record.computer_id);
      if (recordCompId === numId && record.cleaning_date) {
        const dateObj = new Date(record.cleaning_date);
        if (!isNaN(dateObj.getTime()) && (!latestDateObj || dateObj > latestDateObj)) {
          latestDate = record.cleaning_date;
          latestDateObj = dateObj;
        }
      }
    }
  }
  
  // If not found, check localStorage
  if (!latestDate) {
    const localRecords = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
    for (const record of localRecords) {
      const recordCompId = Number(record.computer_id);
      if (recordCompId === numId && record.cleaning_date) {
        const dateObj = new Date(record.cleaning_date);
        if (!isNaN(dateObj.getTime()) && (!latestDateObj || dateObj > latestDateObj)) {
          latestDate = record.cleaning_date;
          latestDateObj = dateObj;
        }
      }
    }
  }
  
  return latestDate;
}
// Load all cleaning records (for displaying dates in table)
loadAllCleaningRecords() {
  const headers = this.getHeaders();
  this.http.get<any[]>(`${this.apiUrl}/api/computers/cleaning/all-records`, { headers }).subscribe({
    next: (data) => {
      if (Array.isArray(data)) {
        this.allCleaningRecordsForFilter = data;
      }
      this.applyFilters();
    },
    error: () => {
      // Fallback to localStorage
      this.allCleaningRecordsForFilter = JSON.parse(localStorage.getItem('cleaning_records') || '[]');
      this.applyFilters();
    }
  });
}
// ✅ New method specifically for loading dates when entering cleaning mode
loadAllCleaningRecordsForDates() {
  const headers = this.getHeaders();
  const url = `${this.apiUrl}/api/computers/cleaning/all-records`;
  console.log('🔍 Calling API:', url);
  console.log('🔍 Headers:', headers);
  
  this.http.get<any[]>(url, { headers }).subscribe({
    next: (data) => {
      console.log('🔍 API SUCCESS - Raw data:', data);
      console.log('🔍 Is array?', Array.isArray(data));
      if (Array.isArray(data)) {
        this.allCleaningRecordsForFilter = data;
        console.log('🔍 Loaded records count:', data.length);
        if (data.length > 0) {
          console.log('🔍 First record:', data[0]);
        }
      }
      this.applyFilters();
    },
    error: (err) => {
      console.error('🔍 API ERROR:', err.status, err.statusText, err.message);
      console.error('🔍 Full error:', err);
      this.allCleaningRecordsForFilter = [];
      this.applyFilters();
    }
  });
}
// ✅ Helper methods for AV status in detail modal
isAVExpiring(pc: any): boolean {
  if (!pc.av_next_update) return false;
  const days = this.getDaysUntil(new Date(pc.av_next_update));
  return days <= 14 && days > 0;
}

isAVExpired(pc: any): boolean {
  if (!pc.av_next_update) return false;
  const days = this.getDaysUntil(new Date(pc.av_next_update));
  return days <= 0;
}

// Helper to get days until a date (reusable)
getDaysUntilDate(dateStr: string): number {
  if (!dateStr || dateStr === '0000-00-00') return Infinity;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
// ✅ New method to handle opening history from detail modal
openHistoryFromDetail(pc: any) {
  // Save the PC reference first
  const pcToView = pc;
  // Close the detail modal
  this.showDetailModal = false;
  // Open history with the saved reference
  this.viewCleaningHistory(pcToView);
}
// ✅ Simple one-click antivirus update
updateAntivirus(pc: any) {
  const today = new Date();
  const nextUpdate = new Date();
  nextUpdate.setDate(today.getDate() + 90); // ✅ Changed from 14 to 90 days
  
  const updateData = {
    av_last_update: today.toISOString().split('T')[0],
    av_next_update: nextUpdate.toISOString().split('T')[0]
  };
  
  const headers = this.getHeaders();
  
  // Update in backend
  this.http.put(`${this.apiUrl}/api/computers/${pc.id}`, { ...pc, ...updateData }, { headers }).subscribe({
    next: () => {
      // Update local data
      const idx = this.pcs.findIndex(p => p.id === pc.id);
      if (idx >= 0) {
        this.pcs[idx].av_last_update = updateData.av_last_update;
        this.pcs[idx].av_next_update = updateData.av_next_update;
        this.saveToCache(this.pcs);
        
        // ✅ Dismiss any existing AV notifications for this PC
        this.dismissAVNotifications(pc);
        
        this.applyFilters();
        this.generateNotifications();
      }
      this.showToastMsg(`🛡️ Antivirus updated for ${pc.computer_name}`, 'success');
    },
    error: () => {
      // Update locally even if backend fails
      const idx = this.pcs.findIndex(p => p.id === pc.id);
      if (idx >= 0) {
        this.pcs[idx].av_last_update = updateData.av_last_update;
        this.pcs[idx].av_next_update = updateData.av_next_update;
        this.saveToCache(this.pcs);
        
        // ✅ Dismiss any existing AV notifications for this PC
        this.dismissAVNotifications(pc);
        
        this.applyFilters();
        this.generateNotifications();
      }
      this.showToastMsg(`🛡️ Updated locally for ${pc.computer_name}`, 'success');
    }
  });
}

// ✅ Add this helper method to dismiss AV notifications for a PC
private dismissAVNotifications(pc: any) {
  const notifKey = `pc_${pc.id}`;
  this.dismissedNotifications.add(`${notifKey}_av_overdue`);
  this.dismissedNotifications.add(`${notifKey}_av_due`);
  this.saveDismissedNotifications();
  this.notifications = this.notifications.filter(n => n.pc && Number(n.pc.id) !== Number(pc.id));
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
          // ✅ Cache the raw data immediately
          this.saveToCache(rawData);
          
          const existingMap = new Map();
          
          // Preserve existing local data first
          this.pcs.forEach(pc => { 
            if (pc.id) existingMap.set(Number(pc.id), pc); 
          });
          
          // Merge server data
          rawData.forEach((serverPC: any) => {
            const id = Number(serverPC.id);
            if (id) {
              const existing = existingMap.get(id);
              if (existing) {
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
          // ✅ Update cache with merged data
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
    try {
      const data = JSON.parse(cached);
      this.isFromCache = true;
      return data;
    } catch { return null; }
  }

  saveToCache(data: any[]) {
    if (!data || data.length === 0) return;
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      localStorage.setItem(this.cacheExpiryKey, (Date.now() + this.CACHE_DURATION).toString());
    } catch (e) {
      console.warn('Cache save failed:', e);
    }
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
    next: (response: any) => {
      this.showModal = false;
      
      // ✅ Update local pcs array immediately
      if (this.editingPC) {
        // Editing existing PC
        const idx = this.pcs.findIndex(p => p.id === this.editingPC!.id);
        if (idx >= 0) {
          // Update the local PC data with form data
          Object.assign(this.pcs[idx], this.formData);
        }
      } else {
        // Adding new PC - add to local array
        const newId = response?.id || Date.now();
        this.pcs.push({ ...this.formData, id: newId, status: 'online' });
      }
      
      // Save to cache and refresh display
      this.saveToCache(this.pcs);
      this.extractLocationsFromPCs();
      this.applyFilters();
      this.generateNotifications();
      this.originalIpAddress = '';
      this.isFromCache = false;
      
      this.showToastMsg(this.editingPC ? '✅ PC updated!' : '✅ PC added!', 'success');
      
      // ✅ Refresh from server in background (without clearing local data)
      this.loadPCsFromServer(true);
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
  
  if (this.showCleanedOnly) {
    filtered = filtered.filter(pc => this.allCleanedPCIds.has(Number(pc.id)));
  }
  
  // Expiry filters
  if (this.filterExpiry === 'expiring') filtered = filtered.filter(pc => this.isExpiring(pc));
  else if (this.filterExpiry === 'expired') filtered = filtered.filter(pc => this.isExpired(pc));
  else if (this.filterExpiry === 'active') filtered = filtered.filter(pc => !this.isExpired(pc) && !this.isExpiring(pc));
  else if (this.filterExpiry === 'office') filtered = filtered.filter(pc => this.isOfficeExpiring(pc) || this.isOfficeExpired(pc));
  else if (this.filterExpiry === 'av') filtered = filtered.filter(pc => pc.av_next_update && this.getDaysUntil(new Date(pc.av_next_update)) <= 14);
  
  if (this.filterLocation !== 'all') filtered = filtered.filter(pc => pc.location === this.filterLocation);
  
  // ✅ Mark PCs that have active notifications
  filtered = filtered.map(pc => {
    const pcNotifications = this.getPCNotifications(pc);
    return {
      ...pc,
      hasWarning: pcNotifications.length > 0,
      notificationCount: pcNotifications.length,
      activeNotifications: pcNotifications
    };
  });
  
  filtered.sort((a, b) => this.ipToNumber(a.ip_address) - this.ipToNumber(b.ip_address));
  this.filteredPCs = filtered;
}

// ✅ Add this method to get notifications for a specific PC
getPCNotifications(pc: any): any[] {
  return this.notifications.filter(n => n.pc && Number(n.pc.id) === Number(pc.id));
}
  ipToNumber(ip: string): number {
    if (!ip) return 0;
    try {const p = ip.split('.'); if (p.length !== 4) return 0; return (+p[0]*16777216)+(+p[1]*65536)+(+p[2]*256)+(+p[3]);} catch {return 0;}
  }

viewDetail(pc: any) {
  this.selectedPC = pc;
  this.detailTab = 'general'; // ✅ Reset to general tab
  this.centerModal('detailModal');
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
  this.selectedStorages = [];
  this.centerModal('editModal'); // ✅ Center the modal
  this.showModal = true;
}

 editPC(pc: any) {
  this.editingPC = pc; 
  this.originalIpAddress = pc.ip_address; 
  this.ipDuplicateError = '';
  
  // ✅ Get the LATEST version of this PC from the array
  const latestPC = this.pcs.find(p => p.id === pc.id) || pc;
  
  // ✅ Ensure the current OS value exists in osList
  if (latestPC.os && !this.osList.includes(latestPC.os)) {
    this.osList.push(latestPC.os);
  }
  // ✅ Populate selected storages from existing data
if (latestPC.storage) {
  this.selectedStorages = latestPC.storage.split(',').map((s: string) => s.trim());
} else {
  this.selectedStorages = [];
}
  // ✅ Use latestPC which has the most current data
  this.formData = {
    computer_name: latestPC.computer_name || '',
    user_name: latestPC.user_name || '',
    location: latestPC.location || '',
    ip_address: latestPC.ip_address || '',
    department: latestPC.department || '',
    os: latestPC.os || '',
    bit: latestPC.bit || '64',
    ram: latestPC.ram || '',
    storage: latestPC.storage || '',
    processor: latestPC.processor || '',
    antivirus: latestPC.antivirus || '',
    mac_address: latestPC.mac_address || '',
    ms_license_type: latestPC.ms_license_type || '',
    license_activation: latestPC.license_activation || '',
    license_duration: latestPC.license_duration || '',
    license_expiry: latestPC.license_expiry || '',
    office_activation: latestPC.office_activation || '',
    office_activation_date: latestPC.office_activation_date || '',
    office_duration: latestPC.office_duration || '',
    office_expiry: latestPC.office_expiry || '',
    av_last_update: latestPC.av_last_update || '',
    av_next_update: latestPC.av_next_update || ''
  };
  
  // ✅ Debug log
  console.log('Edit PC data loaded:', {
    name: this.formData.computer_name,
    office_activation_date: this.formData.office_activation_date,
    office_expiry: this.formData.office_expiry,
    av_last_update: this.formData.av_last_update
  });
  
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