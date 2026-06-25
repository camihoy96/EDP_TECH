import { Component, OnInit } from '@angular/core';
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
      </div>

      <!-- Warning Alert for Expiring Licenses -->
      <div class="expiry-alert" *ngIf="expiringCount > 0">
        <span class="alert-icon">⚠️</span>
        <span><strong>{{ expiringCount }}</strong> computer(s) have Microsoft licenses expiring within 30 days!</span>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" class="filter-input" placeholder="Computer name, user, IP, location...">
        <select [(ngModel)]="filterExpiry" (change)="applyFilters()" class="filter-select">
          <option value="all">All Computers</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="active">Active Licenses</option>
        </select>
        <select [(ngModel)]="filterLocation" (change)="applyFilters()" class="filter-select">
          <option value="all">All Locations</option>
          <option *ngFor="let loc of uniqueLocations" [value]="loc">{{ loc }}</option>
        </select>
        <span class="cache-badge" [class.from-cache]="isFromCache" [class.from-server]="!isFromCache && pcs.length > 0" title="Data source indicator">
          {{ isFromCache ? '💾 Cached' : pcs.length > 0 ? '🌐 Live' : '' }}
        </span>
        <button class="btn btn-primary" (click)="triggerScan()">🔄 Scan Network</button>
        <button class="btn" (click)="forceRefresh()" title="Force refresh from server">🔄 Refresh</button>
        <button class="btn" (click)="addPC()">➕ Add PC</button>
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
              <th>Microsoft License</th>
              <th>License Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pc of filteredPCs" [class.expiring-row]="isExpiring(pc)" [class.expired-row]="isExpired(pc)">
              <td><strong>{{ pc.computer_name }}</strong></td>
              <td>{{ pc.user_name || '—' }}</td>
              <td>
                <span class="location-badge" *ngIf="pc.location">📍 {{ pc.location }}</span>
                <span *ngIf="!pc.location">—</span>
              </td>
              <td><code>{{ pc.ip_address }}</code></td>
              <td>{{ pc.os || '—' }} ({{ pc.bit || '64' }}bit)</td>
              <td>
                <span class="license-badge" [class]="getLicenseClass(pc)">
                  {{ pc.ms_license_type || '—' }}
                </span>
              </td>
              <td>
                <div class="expiry-cell" [class.expiring]="isExpiring(pc)" [class.expired]="isExpired(pc)">
                  <strong>{{ pc.license_expiry ? (pc.license_expiry | date:'MMM d, yyyy') : '—' }}</strong>
                  <div class="countdown" *ngIf="getDaysRemaining(pc) <= 30 && getDaysRemaining(pc) > 0">
                    🔴 {{ getDaysRemaining(pc) }} days left
                  </div>
                  <div class="countdown expired-text" *ngIf="getDaysRemaining(pc) <= 0 && pc.license_expiry">
                    ❌ EXPIRED
                  </div>
                </div>
              </td>
              <td>
                <span class="status-badge" [class]="'status-' + (pc.status || 'unknown')">
                  {{ pc.status || 'unknown' }}
                </span>
              </td>
              <td>
                <button class="action-btn" (click)="viewDetail(pc)" title="View Details">👁️</button>
                <button class="action-btn" (click)="editPC(pc)" title="Edit">✏️</button>
                <button class="action-btn check" (click)="checkLicenseStatus(pc)" title="Check License Status">🔍</button>
                <button class="action-btn" (click)="deletePC(pc)" title="Delete">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="filteredPCs.length === 0">
              <td colspan="9" class="empty-row">
                {{ pcs.length === 0 ? 'Loading computers...' : 'No computers found matching your filters' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" *ngIf="showDetailModal" (click)="closeDetailModal()">
      <div class="modal-content detail-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
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
            <div class="detail-item"><label>License Key:</label><code>{{ selectedPC.license_key || '—' }}</code></div>
            <div class="detail-item"><label>License Expiry:</label>
              <span [class.expiring]="isExpiring(selectedPC)" [class.expired]="isExpired(selectedPC)">
                {{ selectedPC.license_expiry ? (selectedPC.license_expiry | date:'MMM d, yyyy') : '—' }}
                <span class="countdown" *ngIf="getDaysRemaining(selectedPC) <= 30 && getDaysRemaining(selectedPC) > 0">
                  ({{ getDaysRemaining(selectedPC) }} days remaining)
                </span>
                <span class="countdown expired-text" *ngIf="getDaysRemaining(selectedPC) <= 0 && selectedPC.license_expiry">
                  ❌ EXPIRED
                </span>
              </span>
            </div>
            <div class="detail-item"><label>Status:</label>
              <span class="status-badge" [class]="'status-' + (selectedPC.status || 'unknown')">
                {{ selectedPC.status || 'unknown' }}
              </span>
            </div>
            <div class="detail-item"><label>Last Checked:</label><span>{{ selectedPC.last_checked ? (selectedPC.last_checked | date:'MMM d, yyyy h:mm a') : 'Never' }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal - Location is now a text input with datalist suggestions -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
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
              <!-- ✅ Changed to text input with datalist for suggestions -->
              <input type="text" 
                     [(ngModel)]="formData.location" 
                     class="form-input" 
                     placeholder="e.g., EDP Office"
                     list="location-suggestions">
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
                <option value="Windows 7">Windows 7</option>
                <option value="Windows 7 Pro">Windows 7 Pro</option>
                <option value="Windows 8">Windows 8</option>
                <option value="Windows 8.1">Windows 8.1</option>
                <option value="Windows 10 Home">Windows 10 Home</option>
                <option value="Windows 10 Pro">Windows 10 Pro</option>
                <option value="Windows 10 Enterprise">Windows 10 Enterprise</option>
                <option value="Windows 11 Home">Windows 11 Home</option>
                <option value="Windows 11 Pro">Windows 11 Pro</option>
                <option value="Windows 11 Enterprise">Windows 11 Enterprise</option>
                <option value="Windows Server 2016">Windows Server 2016</option>
                <option value="Windows Server 2019">Windows Server 2019</option>
                <option value="Windows Server 2022">Windows Server 2022</option>
                <option value="Linux - Ubuntu">Linux - Ubuntu</option>
                <option value="Linux - CentOS">Linux - CentOS</option>
                <option value="macOS">macOS</option>
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
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="savePC()">{{ editingPC ? 'Update' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- License Check Result Modal -->
    <div class="modal-overlay" *ngIf="showLicenseModal" (click)="closeLicenseModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header" [class.license-expiring]="isExpiring(selectedPC)" [class.license-expired]="isExpired(selectedPC)">
          <h3>🔍 License Status: {{ selectedPC?.computer_name }}</h3>
          <button class="modal-close" (click)="closeLicenseModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedPC">
          <div class="license-status-card">
            <div class="license-icon">{{ isExpired(selectedPC) ? '❌' : isExpiring(selectedPC) ? '⚠️' : '✅' }}</div>
            <h4>{{ isExpired(selectedPC) ? 'License Expired' : isExpiring(selectedPC) ? 'License Expiring Soon' : 'License Active' }}</h4>
            <div class="license-details">
              <div class="license-row"><span>Type:</span><strong>{{ selectedPC.ms_license_type || '—' }}</strong></div>
              <div class="license-row"><span>Key:</span><code>{{ selectedPC.license_key || '—' }}</code></div>
              <div class="license-row"><span>Expiry Date:</span><strong>{{ selectedPC.license_expiry | date:'fullDate' }}</strong></div>
              <div class="license-row"><span>Days Remaining:</span>
                <strong [class.expiring]="isExpiring(selectedPC)" [class.expired]="isExpired(selectedPC)">
                  {{ getDaysRemaining(selectedPC) <= 0 ? 'EXPIRED' : getDaysRemaining(selectedPC) + ' days' }}
                </strong>
              </div>
            </div>
            <div class="countdown-bar">
              <div class="countdown-fill" [style.width.%]="getLicensePercentage(selectedPC)" 
                   [class.expiring]="isExpiring(selectedPC)" 
                   [class.expired]="isExpired(selectedPC)"></div>
            </div>
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
      <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
        <div class="modal-header" style="background: #cc0000;">
          <h3>🗑️ Delete Computer</h3>
          <button class="modal-close" (click)="cancelDelete()">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-content">
            <span class="confirm-icon">⚠️</span>
            <p>Are you sure you want to delete <strong>{{ deleteTarget?.computer_name }}</strong>?</p>
            <div class="confirm-detail" *ngIf="deleteTarget">
              <div><strong>IP:</strong> {{ deleteTarget.ip_address }}</div>
              <div><strong>User:</strong> {{ deleteTarget.user_name || '—' }}</div>
              <div><strong>Location:</strong> {{ deleteTarget.location || '—' }}</div>
              <div><strong>Department:</strong> {{ deleteTarget.department || '—' }}</div>
            </div>
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
    .monitoring-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0; }
    .page-header h2 { margin: 0 0 4px 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; }
    
    .stats-bar { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat-item { flex: 1; text-align: center; padding: 12px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; border-left: 4px solid #0a246a; }
    .stat-item.online { border-left-color: #008800; }
    .stat-item.warning { border-left-color: #cc6600; }
    .stat-item.danger { border-left-color: #cc0000; }
    .stat-label { display: block; font-size: 10px; text-transform: uppercase; color: #888; }
    .stat-value { font-size: 22px; font-weight: 700; color: #333; }

    .expiry-alert { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .alert-icon { font-size: 18px; }

    .filter-bar { display: flex; gap: 12px; align-items: center; padding: 10px 14px; background: #f8f8f8; border: 1px solid #c0c0c0; border-radius: 6px 6px 0 0; position: sticky; top: 0; z-index: 10; }
    .table-container { background: white; border: 1px solid #c0c0c0; border-radius: 0 0 6px 6px; overflow-y: auto; max-height: calc(100vh - 160px); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f0f4f8; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; position: sticky; top: 0; z-index: 5; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #333; }
    .filter-input { padding: 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; width: 180px; }
    .filter-select { padding: 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; }
    .btn { padding: 6px 12px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; }
    .btn-primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-primary:hover { background: #0a3a8c; }
    .count-badge { margin-left: auto; color: #888; font-size: 11px; }
    .expiring-row { background: #fffdf0; }
    .expired-row { background: #fff5f5; }
    code { font-family: monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    
    .status-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: capitalize; }
    .status-online { background: #eeffee; color: #008800; }
    .status-offline { background: #ffecec; color: #cc0000; }
    .status-unknown { background: #f0f0f0; color: #888; }

    .location-badge { 
      background: #e8f4fd; 
      color: #0a246a; 
      padding: 2px 8px; 
      border-radius: 3px; 
      font-size: 10px; 
      font-weight: 500;
      white-space: nowrap;
    }

    .license-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; }
    .license-badge.active { background: #eeffee; color: #008800; }
    .license-badge.expiring { background: #fffae8; color: #cc6600; }
    .license-badge.expired { background: #ffecec; color: #cc0000; }

    .expiry-cell { font-size: 11px; }
    .expiry-cell.expiring { color: #cc6600; }
    .expiry-cell.expired { color: #cc0000; }
    .countdown { font-size: 9px; font-weight: bold; margin-top: 2px; }
    .expired-text { color: #cc0000; }
    .expiring { color: #cc6600 !important; font-weight: bold; }
    .expired { color: #cc0000 !important; font-weight: bold; }

    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 3px; }
    .action-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .action-btn.check:hover { background: #e8f0ff; border-color: #0a246a; }
    .empty-row { text-align: center; padding: 30px; color: #888; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-content { background: white; border-radius: 10px; width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .detail-modal { max-width: 750px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #0a246a; color: white; border-radius: 10px 10px 0 0; }
    .modal-header.license-expiring { background: #cc6600; }
    .modal-header.license-expired { background: #cc0000; }
    .modal-header h3 { margin: 0; font-size: 15px; }
    .modal-close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px 10px; border-radius: 4px; }
    .modal-body { padding: 20px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 20px; border-top: 1px solid #e0e0e0; background: #f8f9fa; border-radius: 0 0 10px 10px; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .detail-item { padding: 8px 12px; background: #f9f9f9; border-radius: 4px; }
    .detail-item label { display: block; font-size: 9px; font-weight: 600; color: #888; text-transform: uppercase; margin-bottom: 2px; }
    .detail-item span, .detail-item code { font-size: 12px; color: #333; }

    .form-row { display: flex; gap: 12px; }
    .form-group { margin-bottom: 12px; flex: 1; }
    .form-group.half { flex: 0.5; }
    .form-group label { display: block; font-weight: 600; font-size: 11px; color: #555; margin-bottom: 4px; }
    .form-input { width: 100%; padding: 7px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; box-sizing: border-box; }

    .license-status-card { text-align: center; padding: 20px; }
    .license-icon { font-size: 48px; margin-bottom: 8px; }
    .license-status-card h4 { margin: 0 0 16px 0; color: #333; }
    .license-details { text-align: left; background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
    .license-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #181717; }
    .license-row:last-child { border-bottom: none; } 
    .countdown-bar { width: 100%; height: 12px; background: #e8e8e8; border-radius: 6px; overflow: hidden; }
    .countdown-fill { height: 100%; border-radius: 6px; background: #008800; transition: width 0.5s; }
    .countdown-fill.expiring { background: #cc6600; }
    .countdown-fill.expired { background: #cc0000; }

    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .confirm-modal { max-width: 420px; }
    .confirm-content { text-align: center; }
    .confirm-icon { font-size: 40px; display: block; margin-bottom: 12px; }
    .confirm-content p { font-size: 12px; color: #333; margin: 0 0 12px 0; }
    .confirm-detail { text-align: left; background: #f9f9f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 11px; color: #0f0f0f; }
    .confirm-detail div { margin-bottom: 4px; }
    .confirm-detail div:last-child { margin-bottom: 0; }
    .confirm-detail strong { color: #555; margin-right: 6px; }
    .confirm-warning { color: #cc0000 !important; font-size: 10px !important; font-weight: 600; }
    .btn-delete { background: #cc0000; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 10px; }
    .btn-delete:hover { background: #aa0000; }
    .hint-text {
  font-size: 9px;
  color: #888;
  margin-top: 4px;
  display: block;
}
 .cache-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: help;
  white-space: nowrap;
}
.cache-badge.from-cache {
  background: #fff8e1;
  color: #f57f17;
}
.cache-badge.from-server {
  background: #e8f5e9;
  color: #2e7d32;
}
  .error-text {
    color: #cc0000;
    font-size: 9px;
    margin-top: 4px;
    display: block;
}
  `]
})
export class ComputerMonitoringComponent implements OnInit {
  pcs: any[] = [];
  filteredPCs: any[] = [];
  searchTerm = '';
  filterExpiry = 'all';
  filterLocation = 'all';
  showModal = false;
  showDetailModal = false;
  showLicenseModal = false;
  editingPC: any = null;
  selectedPC: any = null;
  departments: any[] = [];
  showToast = false;
  showDeleteModal = false;
  deleteTarget: any = null;
  toastMessage = '';
  private isLoadingPCs = false;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  
  private apiUrl = environment.apiUrl;
  
  // Cache properties
  private cacheKey = 'computer_monitoring_cache';
  private cacheExpiryKey = 'computer_monitoring_cache_expiry';
  private CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private cacheVersion = 'v1';
  isFromCache = false;
  originalIpAddress: string = ''; 
  ipDuplicateError: string = '';
  
  existingLocations: string[] = [];
  
  formData: any = {
    computer_name: '', user_name: '', location: '', ip_address: '', department: '',
    os: '', bit: '64', ram: '', storage: '', processor: '',
    antivirus: '', mac_address: '', ms_license_type: '',
    license_activation: '', license_duration: '', license_expiry: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() { 
    this.loadFromCacheOrServer();
    this.loadDepartments();
    this.loadExistingLocations();
  }

  private loadExistingLocations() {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.apiUrl}/api/computers/locations`, { headers }).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.existingLocations = response.filter((loc: string) => loc && loc.trim() !== '').sort();
        } else if (response?.locations && Array.isArray(response.locations)) {
          this.existingLocations = response.locations.filter((loc: string) => loc && loc.trim() !== '').sort();
        }
      },
      error: () => {
        this.extractLocationsFromPCs();
      }
    });
  }

  private extractLocationsFromPCs() {
    const locations = this.pcs
      .map(pc => pc.location)
      .filter((loc: string) => loc && loc.trim() !== '');
    this.existingLocations = [...new Set(locations)].sort();
  }

  private loadFromCacheOrServer() {
    // ✅ Try cache first for instant display
    const cachedData = this.getFromCache();
    if (cachedData && cachedData.length > 0) {
      console.log('📦 Displaying cached data:', cachedData.length, 'computers');
      this.pcs = cachedData;
      this.applyFilters();
      this.extractLocationsFromPCs();
      this.isFromCache = true;
    }
    
    // ✅ Always fetch from server (but don't clear existing data)
    this.loadPCsFromServer(true);
  }

  get uniqueLocations(): string[] {
    const locations = this.pcs
      .map(pc => pc.location)
      .filter(loc => loc && loc.trim() !== '');
    return [...new Set(locations)].sort();
  }

  get totalComputers(): number {
    return this.pcs.length;
  }

  get expiringCount(): number {
    return this.pcs.filter(pc => this.getDaysRemaining(pc) > 0 && this.getDaysRemaining(pc) <= 30).length;
  }

  get expiredCount(): number {
    return this.pcs.filter(pc => this.getDaysRemaining(pc) <= 0 && pc.license_expiry).length;
  }

  get onlineCount(): number {
    return this.pcs.filter(pc => pc.status === 'online').length;
  }

  getDaysRemaining(pc: any): number {
    if (!pc.license_expiry) return Infinity;
    const expiry = new Date(pc.license_expiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getLicensePercentage(pc: any): number {
    if (!pc.license_expiry) return 100;
    const days = this.getDaysRemaining(pc);
    if (days <= 0) return 100;
    return Math.min(100, Math.max(0, (days / 365) * 100));
  }

  isExpiring(pc: any): boolean {
    const days = this.getDaysRemaining(pc);
    return days > 0 && days <= 30;
  }

  isExpired(pc: any): boolean {
    return this.getDaysRemaining(pc) <= 0 && !!pc.license_expiry;
  }

  getLicenseClass(pc: any): string {
    if (this.isExpired(pc)) return 'expired';
    if (this.isExpiring(pc)) return 'expiring';
    return 'active';
  }

  getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  loadDepartments() {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${this.apiUrl}/api/department-roles`, { headers }).subscribe({
      next: (data) => {
        const uniqueDepartments = new Map();
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.department_name && !uniqueDepartments.has(item.department_name)) {
              uniqueDepartments.set(item.department_name, { name: item.department_name });
            }
          });
          this.departments = Array.from(uniqueDepartments.values());
        } else {
          this.departments = [];
        }
      },
      error: (err) => {
        console.error('❌ Failed to load departments:', err);
      }
    });
  }

  // ✅ KEY FIX: Merge new data with existing data, don't replace
  private loadPCsFromServer(silent: boolean = false) {
    if (this.isLoadingPCs) {
      console.log('⚠️ Already loading, skipping duplicate call');
      return;
    }
    this.isLoadingPCs = true;
    
    const headers = this.getHeaders();
    
    this.http.get<any>(`${this.apiUrl}/api/computers`, { headers }).subscribe({
      next: (response) => { 
        let rawData: any[] = [];
        if (Array.isArray(response)) {
          rawData = response;
        } else if (response?.computers && Array.isArray(response.computers)) {
          rawData = response.computers;
        } else if (response?.data && Array.isArray(response.data)) {
          rawData = response.data;
        }
        
        if (rawData.length > 0) {
          // ✅ MERGE: Create a map of existing PCs by ID
          const existingMap = new Map();
          this.pcs.forEach(pc => {
            if (pc.id) {
              existingMap.set(Number(pc.id), pc);
            }
          });
          
          // ✅ Add/Update from server data
          rawData.forEach((pc: any) => {
            const id = Number(pc.id);
            if (id) {
              existingMap.set(id, pc); // This will add new or update existing
            }
          });
          
          // Convert back to array
          this.pcs = Array.from(existingMap.values());
          
          console.log(`✅ Merged data: ${this.pcs.length} total computers (${rawData.length} from server)`);
          
          // Save merged data to cache
          this.saveToCache(this.pcs);
          this.extractLocationsFromPCs();
          this.isFromCache = false;
        } else {
          console.log('⚠️ Server returned empty data, keeping existing records');
        }
        
        this.applyFilters();
        this.isLoadingPCs = false;
      },
      error: (err) => {
        console.error('❌ Failed to load computers:', err);
        
        // ✅ Keep existing data on error
        if (this.pcs.length === 0) {
          const cachedData = this.getFromCache();
          if (cachedData && cachedData.length > 0) {
            this.pcs = cachedData;
            this.applyFilters();
            if (!silent) {
              this.showToastMsg('⚠️ Server unavailable. Showing cached data.', 'error');
            }
          } else if (!silent) {
            this.showToastMsg('Failed to load computers. Check server connection.', 'error');
          }
        } else if (!silent) {
          this.showToastMsg('⚠️ Could not refresh. Showing existing data.', 'error');
        }
        
        this.isLoadingPCs = false;
      }
    });
  }

  checkIpDuplicate() {
    const ip = this.formData.ip_address;
    if (!ip) {
      this.ipDuplicateError = '';
      return;
    }
    
    const existingPC = this.pcs.find(pc => 
      pc.ip_address === ip && 
      (!this.editingPC || pc.id !== this.editingPC.id)
    );
    
    if (existingPC) {
      this.ipDuplicateError = `⚠️ IP ${ip} is already used by "${existingPC.computer_name}"`;
    } else {
      this.ipDuplicateError = '';
    }
  }

  // ✅ FIXED: Scan Network - Don't clear cache, just refresh and merge
  triggerScan() {
    const headers = this.getHeaders();
    this.showToastMsg('🔍 Starting network scan...', 'success');
    
    this.http.post(`${this.apiUrl}/api/computers/scan`, {}, { headers }).subscribe({
      next: (response) => {
        console.log('Scan response:', response);
        this.showToastMsg('Scan started! Results will appear automatically...', 'success');
        
        // ✅ Poll for new results without clearing existing data
        setTimeout(() => {
          this.isLoadingPCs = false;
          this.loadPCsFromServer(true); // silent refresh
        }, 10000);
      },
      error: (err) => {
        console.error('Scan failed:', err);
        this.showToastMsg('Scan service unavailable. Showing existing data.', 'error');
      }
    });
  }

  calculateExpiry() {
    if (this.formData.license_activation && this.formData.license_duration) {
      const activationDate = new Date(this.formData.license_activation);
      const months = parseInt(this.formData.license_duration);
      if (!isNaN(months)) {
        activationDate.setMonth(activationDate.getMonth() + months);
        this.formData.license_expiry = activationDate.toISOString().split('T')[0];
      }
    } else {
      this.formData.license_expiry = '';
    }
  }

  private getCacheKey(): string {
    return `${this.cacheKey}_${this.cacheVersion}`;
  }

  private getCacheExpiryKey(): string {
    return `${this.cacheExpiryKey}_${this.cacheVersion}`;
  }

  isCacheValid(): boolean {
    const expiry = localStorage.getItem(this.getCacheExpiryKey());
    if (!expiry) return false;
    const isValid = Date.now() < parseInt(expiry);
    if (!isValid) {
      this.clearCache();
    }
    return isValid;
  }

  getFromCache(): any[] | null {
    if (!this.isCacheValid()) return null;
    const cached = localStorage.getItem(this.getCacheKey());
    if (!cached) return null;
    try {
      const data = JSON.parse(cached);
      this.isFromCache = true;
      return data;
    } catch (e) {
      this.clearCache();
      return null;
    }
  }

  saveToCache(data: any[]) {
    if (!data || data.length === 0) return;
    try {
      localStorage.setItem(this.getCacheKey(), JSON.stringify(data));
      localStorage.setItem(this.getCacheExpiryKey(), (Date.now() + this.CACHE_DURATION).toString());
      console.log(`💾 Cached ${data.length} computers`);
    } catch (e) {
      console.warn('Failed to save cache:', e);
    }
  }

  clearCache() {
    localStorage.removeItem(this.getCacheKey());
    localStorage.removeItem(this.getCacheExpiryKey());
    this.isFromCache = false;
  }

  // ✅ FIXED: Force Refresh - Don't clear existing data, just merge
  forceRefresh() {
    this.isLoadingPCs = false;
    this.loadPCsFromServer(false);
    this.showToastMsg('🔄 Refreshing data from server...', 'success');
  }

  savePC() {
    if (!this.formData.computer_name || !this.formData.ip_address) {
      this.showToastMsg('Computer Name and IP Address are required!', 'error');
      return;
    }
    
    const headers = this.getHeaders();
    
    if (!this.editingPC) {
      const existingPC = this.pcs.find(pc => pc.ip_address === this.formData.ip_address);
      if (existingPC) {
        this.showToastMsg(`❌ IP ${this.formData.ip_address} already exists!`, 'error');
        return;
      }
    }
    
    if (this.editingPC && this.formData.ip_address !== this.originalIpAddress) {
      const existingPC = this.pcs.find(pc => 
        pc.ip_address === this.formData.ip_address && pc.id !== this.editingPC.id
      );
      if (existingPC) {
        this.showToastMsg(`❌ IP ${this.formData.ip_address} is already used!`, 'error');
        return;
      }
    }
    
    const dataToSend = {
      ...this.formData,
      license_activation: this.formData.license_activation || null,
      license_duration: this.formData.license_duration || null,
      license_expiry: this.formData.license_expiry || null,
      license_key: '',
      status: 'online'
    };
    
    const url = this.editingPC 
      ? `${this.apiUrl}/api/computers/${this.editingPC.id}` 
      : `${this.apiUrl}/api/computers`;
    
    const request = this.editingPC 
      ? this.http.put(url, dataToSend, { headers }) 
      : this.http.post(url, dataToSend, { headers });
    
    request.subscribe({
      next: () => { 
        this.showModal = false;
        // ✅ Don't clear cache, just refresh and merge
        this.isLoadingPCs = false;
        this.loadPCsFromServer(true);
        this.originalIpAddress = '';
        this.showToastMsg(this.editingPC ? '✅ PC updated!' : '✅ PC added!', 'success'); 
      },
      error: (err) => { 
        console.error('Save error:', err);
        if (err.error?.sqlMessage?.includes('Duplicate entry')) {
          this.showToastMsg(`❌ IP already exists!`, 'error');
        } else {
          this.showToastMsg('Failed to save. Please try again.', 'error');
        }
      }
    });
  }

  deletePC(pc: any) {
    this.deleteTarget = pc;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    const pc = this.deleteTarget;
    const headers = this.getHeaders();
    
    this.http.delete(`${this.apiUrl}/api/computers/${pc.id}`, { headers }).subscribe({
      next: () => {
        // ✅ Remove from local array immediately
        this.pcs = this.pcs.filter(p => p.id !== pc.id); 
        this.saveToCache(this.pcs);
        this.extractLocationsFromPCs();
        this.applyFilters(); 
        this.closeDeleteModal();
        this.showToastMsg('✅ Computer deleted!', 'success');
      },
      error: (err) => { 
        console.error('Delete error:', err); 
        this.showToastMsg('Failed to delete', 'error');
        this.closeDeleteModal();
      }
    });
  }

  cancelDelete() {
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  applyFilters() {
    let filtered = [...this.pcs];
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(pc => 
        pc.computer_name?.toLowerCase().includes(term) || 
        pc.ip_address?.toLowerCase().includes(term) ||
        pc.user_name?.toLowerCase().includes(term) ||
        pc.location?.toLowerCase().includes(term)
      );
    }
    
    if (this.filterExpiry === 'expiring') {
      filtered = filtered.filter(pc => this.isExpiring(pc));
    } else if (this.filterExpiry === 'expired') {
      filtered = filtered.filter(pc => this.isExpired(pc));
    } else if (this.filterExpiry === 'active') {
      filtered = filtered.filter(pc => !this.isExpired(pc) && !this.isExpiring(pc));
    }
    
    if (this.filterLocation !== 'all') {
      filtered = filtered.filter(pc => pc.location === this.filterLocation);
    }
    
    filtered.sort((a, b) => {
      const ipA = this.ipToNumber(a.ip_address);
      const ipB = this.ipToNumber(b.ip_address);
      return ipA - ipB;
    });
    
    this.filteredPCs = filtered;
  }

  ipToNumber(ip: string): number {
    if (!ip) return 0;
    try {
      const parts = ip.split('.');
      if (parts.length !== 4) return 0;
      return (parseInt(parts[0]) * 256 * 256 * 256) +
             (parseInt(parts[1]) * 256 * 256) +
             (parseInt(parts[2]) * 256) +
             parseInt(parts[3]);
    } catch (e) {
      return 0;
    }
  }

  viewDetail(pc: any) { this.selectedPC = pc; this.showDetailModal = true; }
  closeDetailModal() { this.showDetailModal = false; this.selectedPC = null; }
  checkLicenseStatus(pc: any) { this.selectedPC = pc; this.showLicenseModal = true; }
  closeLicenseModal() { this.showLicenseModal = false; }

  addPC() {
    this.editingPC = null;
    this.originalIpAddress = '';
    this.ipDuplicateError = '';
    this.formData = { 
      computer_name: '', user_name: '', location: '', ip_address: '', department: '', 
      os: '', bit: '64', ram: '', storage: '', processor: '',
      antivirus: '', mac_address: '', ms_license_type: '', 
      license_activation: '', license_duration: '', license_expiry: ''
    };
    this.showModal = true;
  }

  editPC(pc: any) { 
    this.editingPC = pc; 
    this.originalIpAddress = pc.ip_address;
    this.ipDuplicateError = '';
    this.formData = { 
      computer_name: pc.computer_name || '',
      user_name: pc.user_name || '',
      location: pc.location || '',
      ip_address: pc.ip_address || '',
      department: pc.department || '',
      os: pc.os || '',
      bit: pc.bit || '64',
      ram: pc.ram || '',
      storage: pc.storage || '',
      processor: pc.processor || '',
      antivirus: pc.antivirus || '',
      mac_address: pc.mac_address || '',
      ms_license_type: pc.ms_license_type || '',
      license_activation: pc.license_activation || '',
      license_duration: pc.license_duration || '',
      license_expiry: pc.license_expiry || ''
    };
    this.showModal = true; 
  }
  
  closeModal() { 
    this.showModal = false; 
    this.editingPC = null;
    this.ipDuplicateError = '';
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; 
    this.toastType = type; 
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}
