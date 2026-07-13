import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="board">

      <!-- ============================================ -->
      <!-- HEADER -->
      <!-- ============================================ -->
      <header class="board-header">
        <div class="header-text">
          <span class="eyebrow">Org Directory</span>
          <h2 class="board-title">Departments &amp; Positions</h2>
          <p class="board-sub">Manage departments, locations and roles</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-board" (click)="loadData()" title="Refresh">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 4v6h6M20 20v-6h-6M5.5 9a7 7 0 0 1 12.6-2.3M18.5 15a7 7 0 0 1-12.6 2.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Refresh
          </button>
          <button class="btn btn-board" (click)="openCreateRoleForm()" [disabled]="!selectedBranchId">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Position
          </button>
          <button class="btn btn-primary" (click)="openCreateDeptForm()" [disabled]="!selectedBranchId">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Department
          </button>
        </div>
      </header>

      <!-- Branch Filter - Now required -->
      <div class="branch-filter" *ngIf="branches.length > 0">
        <label>Select Branch:</label>
        <select [(ngModel)]="selectedBranchId" (change)="onBranchChange()" class="form-control branch-select">
          <option value="">-- Select a branch --</option>
          <option *ngFor="let branch of branches" [value]="branch.id">
            {{ branch.name }}
            <span *ngIf="branch.company_name" class="branch-company-small">{{ branch.company_name }}</span>
          </option>
        </select>
        <span class="filter-count" *ngIf="selectedBranchId && filteredDepartments.length > 0">
          {{ filteredDepartments.length }} department(s)
        </span>
        <span class="filter-count" *ngIf="selectedBranchId && filteredDepartments.length === 0">
          No departments in this branch
        </span>
        <span class="filter-count" *ngIf="!selectedBranchId">
          Please select a branch to manage departments
        </span>
      </div>

      <!-- ============================================ -->
      <!-- DIRECTORY (alphabet rail + plaques) -->
      <!-- ============================================ -->
      <div class="directory" *ngIf="selectedBranchId && filteredDepartments.length > 0">

        <nav class="alpha-rail" aria-label="Jump to department">
          <button
            *ngFor="let letter of groupedLetters"
            type="button"
            class="alpha-btn"
            (click)="scrollToLetter(letter)"
            [attr.aria-label]="'Jump to ' + letter">{{ letter }}</button>
        </nav>

        <div class="plaques">
          <div class="count-row">
            <span class="count-chip">{{ filteredDepartments.length }} department{{ filteredDepartments.length === 1 ? '' : 's' }}</span>
            <span class="count-chip branch-name" *ngIf="selectedBranchId">
              in {{ getBranchName(selectedBranchId) }}
              <span *ngIf="getBranchCompany(selectedBranchId)" class="branch-company-small">
                ({{ getBranchCompany(selectedBranchId) }})
              </span>
            </span>
          </div>

          <div
            class="plaque"
            *ngFor="let dept of filteredDepartments"
            [id]="'dept-' + dept.id"
            [class.expanded]="expandedDept === dept.id">

            <div class="plaque-head" (click)="toggleDepartment(dept.id)">
              <div class="letter-chip">{{ (dept.name || '?').charAt(0).toUpperCase() }}</div>

              <div class="plaque-info">
                <h4 class="plaque-name">{{ dept.name }}</h4>
                <p class="plaque-location" *ngIf="dept.location">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none"><path d="M12 21s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9" r="2.2" stroke="currentColor" stroke-width="1.6"/></svg>
                  {{ dept.location }}
                </p>
              </div>

              <div class="plaque-meta">
                <span class="role-tally">{{ getRoleCount(dept.id) }} position{{ getRoleCount(dept.id) === 1 ? '' : 's' }}</span>
                <button class="icon-btn" (click)="$event.stopPropagation(); openEditDeptForm(dept)" title="Edit department" aria-label="Edit department">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M3 21l3.6-.9L19.5 7.2a1.5 1.5 0 0 0 0-2.1l-1.6-1.6a1.5 1.5 0 0 0-2.1 0L2.9 16.4 3 21Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                </button>
                <button class="icon-btn danger" (click)="$event.stopPropagation(); confirmDeleteDept(dept)" title="Delete department" aria-label="Delete department">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 7h16M9 7V4.8c0-.4.3-.8.8-.8h4.4c.5 0 .8.4.8.8V7M6 7l1 13.2c0 .5.4.8.9.8h8.2c.5 0 .9-.3.9-.8L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <span class="chevron" [class.open]="expandedDept === dept.id">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
              </div>
            </div>

            <div class="roster" *ngIf="expandedDept === dept.id">
              <div class="roster-bar">
                <span class="roster-label">Positions in {{ dept.name }}</span>
                <button class="btn btn-board btn-sm" (click)="openCreateRoleForm(dept.id)">
                  <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  Add position
                </button>
              </div>

              <ng-container *ngIf="getRolesByDepartment(dept.id).length > 0; else noRoles">
                <div class="slat" *ngFor="let role of getRolesByDepartment(dept.id)">
                  <div class="slat-text">
                    <span class="slat-name">{{ role.role_name }}</span>
                  </div>
                  <div class="slat-actions">
                    <button class="icon-btn" (click)="openEditRoleForm(role)" title="Edit position" aria-label="Edit position">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M3 21l3.6-.9L19.5 7.2a1.5 1.5 0 0 0 0-2.1l-1.6-1.6a1.5 1.5 0 0 0-2.1 0L2.9 16.4 3 21Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="icon-btn danger" (click)="confirmDeleteRole(role)" title="Delete position" aria-label="Delete position">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 7h16M9 7V4.8c0-.4.3-.8.8-.8h4.4c.5 0 .8.4.8.8V7M6 7l1 13.2c0 .5.4.8.9.8h8.2c.5 0 .9-.3.9-.8L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </ng-container>
              <ng-template #noRoles>
                <div class="empty-roster">
                  <p>No positions added to this department yet.</p>
                  <button class="btn btn-primary btn-sm" (click)="openCreateRoleForm(dept.id)">Add the first position</button>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- EMPTY STATE - No branch selected -->
      <!-- ============================================ -->
      <div class="empty-board" *ngIf="!selectedBranchId && branches.length > 0 && !showDeptForm && !showRoleForm">
        <svg class="empty-icon" viewBox="0 0 64 64" width="56" height="56" fill="none">
          <rect x="14" y="10" width="36" height="46" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M22 18h6M22 26h6M22 34h6M36 18h6M36 26h6M36 34h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <rect x="27" y="44" width="10" height="12" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>Select a Branch</h3>
        <p>Please select a branch from the dropdown above to view its departments and positions.</p>
      </div>

      <!-- ============================================ -->
      <!-- EMPTY STATE - No departments in branch -->
      <!-- ============================================ -->
      <div class="empty-board" *ngIf="selectedBranchId && filteredDepartments.length === 0 && !showDeptForm && !showRoleForm">
        <svg class="empty-icon" viewBox="0 0 64 64" width="56" height="56" fill="none">
          <rect x="14" y="10" width="36" height="46" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M22 18h6M22 26h6M22 34h6M36 18h6M36 26h6M36 34h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <rect x="27" y="44" width="10" height="12" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>No departments in this branch</h3>
        <p>Create a department for <strong>{{ getBranchName(selectedBranchId) }}</strong> to get started.</p>
        <button class="btn btn-primary btn-lg" (click)="openCreateDeptForm()">Create department</button>
      </div>

      <!-- ============================================ -->
      <!-- DEPARTMENT FORM MODAL (Branch is read-only) -->
      <!-- ============================================ -->
      <div class="modal-overlay" *ngIf="showDeptForm" (click)="closeDeptForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <span class="modal-tag">{{ editingDept ? 'Edit' : 'New' }}</span>
            <span class="modal-branch" *ngIf="selectedBranchId">
              <span class="branch-tag">{{ getBranchName(selectedBranchId) }}</span>
              <span *ngIf="getBranchCompany(selectedBranchId)" class="branch-company-small">
                {{ getBranchCompany(selectedBranchId) }}
              </span>
            </span>
            <button class="modal-close" (click)="closeDeptForm()" aria-label="Close">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>

          <div class="preview-plaque">
            <div class="letter-chip small">{{ deptForm.name ? deptForm.name.charAt(0).toUpperCase() : '?' }}</div>
            <div class="preview-text">
              <div class="preview-name">{{ deptForm.name || 'Department name' }}</div>
              <div class="preview-loc" *ngIf="deptForm.location">{{ deptForm.location }}</div>
              <div class="preview-loc" *ngIf="selectedBranchId">
                <span class="branch-tag">{{ getBranchName(selectedBranchId) }}</span>
                <span *ngIf="getBranchCompany(selectedBranchId)" class="branch-company-small">
                  {{ getBranchCompany(selectedBranchId) }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-body">
            <!-- Branch is now displayed as a read-only label -->
            <div class="field">
              <label>Branch (read-only)</label>
              <div class="branch-display">
                <span class="branch-tag-large">{{ getBranchName(selectedBranchId) }}</span>
                <span *ngIf="getBranchCompany(selectedBranchId)" class="branch-company-small">
                  {{ getBranchCompany(selectedBranchId) }}
                </span>
                <span class="branch-hint">Branch is determined by your current selection</span>
              </div>
            </div>
            <div class="field">
              <label>Department name *</label>
              <input type="text" [(ngModel)]="deptForm.name" class="form-control"
                     placeholder="e.g., Engineering" autofocus>
            </div>
            <div class="field">
              <label>Location <span class="optional">optional</span></label>
              <input type="text" [(ngModel)]="deptForm.location" class="form-control"
                     placeholder="e.g., Floor 4, Building A">
            </div>
            <div class="error-bar" *ngIf="deptError">{{ deptError }}</div>
          </div>

          <div class="modal-foot">
            <button class="btn btn-paper" (click)="closeDeptForm()">Cancel</button>
            <button class="btn btn-primary" (click)="saveDepartment()"
                    [disabled]="saving || !deptForm.name.trim() || !selectedBranchId">
              {{ saving ? 'Saving…' : (editingDept ? 'Save changes' : 'Create department') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- ROLE / POSITION FORM MODAL (Simplified) -->
      <!-- ============================================ -->
     <!-- ROLE / POSITION FORM MODAL (Simplified) -->
<div class="modal-overlay" *ngIf="showRoleForm" (click)="closeRoleForm()">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-top">
      <span class="modal-tag">{{ editingRole ? 'Edit' : 'New' }}</span>
      <span class="modal-branch" *ngIf="selectedBranchId">
        <span class="branch-tag">{{ getBranchName(selectedBranchId) }}</span>
        <span *ngIf="getBranchCompany(selectedBranchId)" class="branch-company-small">
          {{ getBranchCompany(selectedBranchId) }}
        </span>
      </span>
      <button class="modal-close" (click)="closeRoleForm()" aria-label="Close">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="preview-plaque">
      <div class="preview-text">
        <div class="preview-name">{{ roleForm.role_name || 'Position name' }}</div>
        <div class="preview-loc" *ngIf="selectedBranchId">
          <span class="branch-tag">{{ getBranchName(selectedBranchId) }}</span>
          <span *ngIf="getBranchCompany(selectedBranchId)" class="branch-company-small">
            {{ getBranchCompany(selectedBranchId) }}
          </span>
        </div>
      </div>
    </div>

    <div class="modal-body">
      <div class="field">
        <label>Department *</label>
        <select [(ngModel)]="roleForm.department_id" class="form-control">
          <option value="">Select department</option>
          <option *ngFor="let dept of filteredDepartments" [value]="dept.id">
            {{ dept.name }}
          </option>
        </select>
      </div>
      <div class="field">
        <label>Position Name *</label>
        <input type="text" [(ngModel)]="roleForm.role_name" class="form-control"
               placeholder="e.g., Department Head, Manager, Staff">
      </div>
      <div class="error-bar" *ngIf="roleError">{{ roleError }}</div>
    </div>

    <div class="modal-foot">
      <button class="btn btn-paper" (click)="closeRoleForm()">Cancel</button>
      <button class="btn btn-primary" (click)="saveRole()"
              [disabled]="savingRole || !roleForm.department_id || !roleForm.role_name">
        {{ savingRole ? 'Saving…' : (editingRole ? 'Save changes' : 'Add position') }}
      </button>
    </div>
  </div>
</div>

      <!-- ============================================ -->
      <!-- DELETE CONFIRMATION MODAL -->
      <!-- ============================================ -->
      <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
        <div class="modal-card delete-card" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <span class="modal-tag danger">Remove</span>
            <button class="modal-close" (click)="cancelDelete()" aria-label="Close">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>

          <div class="modal-body delete-body">
            <svg class="warning-icon" viewBox="0 0 24 24" width="26" height="26" fill="none"><path d="M12 4 2 20h20L12 4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>

            <p class="delete-question">Remove this for good?</p>

            <div class="delete-info" *ngIf="deleteTarget">
              <div *ngIf="deleteTarget.type === 'department'">
                <strong>{{ deleteTarget.data.name }}</strong>
                <p class="warning-text">This also removes every position listed under this department in this branch.</p>
              </div>
              <div *ngIf="deleteTarget.type === 'role'">
                <strong>{{ deleteTarget.data.role_name }}</strong>
                <span class="delete-sub"> — {{ deleteTarget.data.department_name }}</span>
              </div>
            </div>

            <p class="warning-text">This can't be undone.</p>
          </div>

          <div class="modal-foot">
            <button class="btn btn-paper" (click)="cancelDelete()">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 7h16M9 7V4.8c0-.4.3-.8.8-.8h4.4c.5 0 .8.4.8.8V7M6 7l1 13.2c0 .5.4.8.9.8h8.2c.5 0 .9-.3.9-.8L18 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- TOAST NOTIFICATION -->
      <!-- ============================================ -->
      <div class="toast" [class.show]="showToast" [class.error]="toastType === 'error'">
        <span class="toast-dot"></span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .board {
      --ink: #1a1d24;
      --ink-panel: #f8f9fc;
      --ink-panel-2: #f0f2f6;
      --hairline: #dce0e6;
      --primary: #1a3a8c;
      --primary-deep: #0f2a6a;
      --primary-light: #e8edf8;
      --paper: #ffffff;
      --paper-line: #dce0e6;
      --ink-text: #1a1d24;
      --muted: #6b7280;
      --charcoal: #1a1d24;
      --charcoal-soft: #6b7280;
      --success: #16a34a;
      --danger: #dc2626;
      --amber: #d97706;

      position: relative;
      padding: 28px;
      background: #f3f4f6;
      color: var(--ink-text);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      font-size: 13px;
      border-radius: 10px;
      min-height: 100%;
    }
    .board *, .board *::before, .board *::after { box-sizing: border-box; }
    .board :focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

    /* ---------- header ---------- */
    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--hairline);
    }
    .eyebrow {
      display: block;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--primary);
      font-weight: 600;
      margin-bottom: 4px;
    }
    .board-title {
      margin: 0;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 24px;
      letter-spacing: -0.02em;
      color: var(--ink-text);
    }
    .board-sub { margin: 2px 0 0; color: var(--muted); font-size: 12px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ---------- branch filter ---------- */
    .branch-filter {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 10px 16px;
      background: white;
      border: 1px solid var(--hairline);
      border-radius: 6px;
      flex-wrap: wrap;
    }
    .branch-filter label {
      font-weight: 600;
      font-size: 12px;
      color: var(--muted);
    }
    .branch-select {
      width: 220px;
      padding: 6px 10px;
      border: 1px solid var(--hairline);
      border-radius: 4px;
      font-size: 12px;
      background: white;
    }
    .branch-select option {
      padding: 4px 8px;
    }
    .filter-count {
      font-size: 11px;
      color: var(--muted);
      margin-left: auto;
    }
    .branch-name {
      font-weight: 600;
      color: var(--primary);
      margin-left: 8px;
    }

    /* ---------- buttons ---------- */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background .15s, border-color .15s, transform .1s;
      white-space: nowrap;
    }
    .btn:active { transform: translateY(1px); }
    .btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-lg { padding: 12px 22px; font-size: 13px; }

    .btn-primary { background: var(--primary); border-color: var(--primary); color: white; font-weight: 600; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-deep); }

    .btn-board { background: white; border-color: var(--hairline); color: var(--ink-text); }
    .btn-board:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }

    .btn-paper { background: transparent; border-color: var(--hairline); color: var(--charcoal-soft); }
    .btn-paper:hover { border-color: var(--primary); color: var(--primary); }

    .btn-danger { background: var(--danger); border-color: var(--danger); color: white; }
    .btn-danger:hover { background: #b91c1c; }

    .icon-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
    }
    .icon-btn:hover { background: var(--primary-light); color: var(--primary); }
    .icon-btn.danger:hover { background: #fef2f2; color: var(--danger); }

    /* ---------- directory layout ---------- */
    .directory { display: flex; gap: 18px; align-items: flex-start; }

    .alpha-rail {
      position: sticky;
      top: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-shrink: 0;
      background: white;
      border: 1px solid var(--hairline);
      border-radius: 6px;
      padding: 6px 4px;
    }
    .alpha-btn {
      width: 22px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: 'Inter', monospace;
      font-size: 10px;
      border-radius: 3px;
      cursor: pointer;
    }
    .alpha-btn:hover { background: var(--primary-light); color: var(--primary); }

    .plaques { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }

    .count-row { 
      display: flex; 
      justify-content: flex-end; 
      align-items: center;
      gap: 12px;
    }
    .count-chip {
      font-family: 'Inter', monospace;
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.04em;
    }

    /* ---------- plaque (department card) ---------- */
    .plaque {
      background: white;
      border: 1px solid var(--hairline);
      border-radius: 7px;
      overflow: hidden;
      transition: border-color .2s;
      scroll-margin-top: 16px;
    }
    .plaque:hover { border-color: var(--primary); }
    .plaque.expanded { border-color: var(--primary); box-shadow: 0 2px 8px rgba(26,58,140,0.08); }

    .plaque-head {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      cursor: pointer;
    }

    .letter-chip {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      background: var(--primary);
      color: white;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 18px;
    }
    .letter-chip.small { width: 34px; height: 34px; font-size: 16px; }

    .plaque-info { flex: 1; min-width: 0; }
    .plaque-name {
      margin: 0 0 3px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 15px;
      color: var(--ink-text);
    }
    .plaque-location {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--muted);
    }

    .plaque-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .role-tally {
      font-family: 'Inter', monospace;
      font-size: 10px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--primary);
      background: var(--primary-light);
      padding: 4px 9px;
      border-radius: 999px;
      margin-right: 4px;
      white-space: nowrap;
    }
    .chevron { display: flex; color: var(--muted); transition: transform .2s; margin-left: 4px; }
    .chevron.open { transform: rotate(180deg); color: var(--primary); }

    /* ---------- roster ---------- */
    .roster {
      padding: 0 16px 16px 72px;
      border-top: 1px solid var(--hairline);
      background: #fafbfc;
    }
    .roster-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 10px;
    }
    .roster-label {
      font-family: 'Inter', monospace;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 600;
    }

    .slat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      background: white;
      border: 1px solid var(--hairline);
      border-radius: 5px;
      margin-bottom: 6px;
    }
    .slat:hover { border-color: var(--primary); }
    .slat-text { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
    .slat-name { font-weight: 600; font-size: 12.5px; color: var(--ink-text); }
    .slat-actions { display: flex; gap: 2px; flex-shrink: 0; }

    .empty-roster { text-align: center; padding: 18px; color: var(--muted); }
    .empty-roster p { margin: 0 0 10px; font-size: 12px; }

    /* ---------- empty board state ---------- */
    .empty-board {
      text-align: center;
      padding: 70px 20px;
      background: white;
      border: 1px dashed var(--hairline);
      border-radius: 8px;
      color: var(--muted);
    }
    .empty-icon { margin-bottom: 14px; color: var(--primary); }
    .empty-board h3 { margin: 0 0 6px; color: var(--ink-text); font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 600; }
    .empty-board p { margin: 0 0 22px; font-size: 12.5px; }
    .empty-board strong { color: var(--primary); }

    /* ---------- modals ---------- */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: fadeIn .15s ease;
      padding: 20px;
    }
    .modal-card {
      background: white;
      color: var(--charcoal);
      border-radius: 10px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
      animation: slideIn .2s ease;
    }
    .modal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 22px;
      border-bottom: 1px solid var(--hairline);
    }
    .modal-tag {
      font-family: 'Inter', monospace;
      font-size: 10.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
      font-weight: 600;
    }
    .modal-tag.danger { color: var(--danger); }
    .modal-branch {
      margin-left: auto;
      margin-right: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .branch-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--primary-light);
      color: var(--primary);
      padding: 3px 10px;
      border-radius: 3px;
    }
    .branch-tag-large {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--primary-light);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 4px;
    }
    .branch-display {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid var(--hairline);
      border-radius: 5px;
    }
    .branch-hint {
      font-size: 10px;
      color: var(--muted);
      font-style: italic;
    }
    .modal-close {
      background: transparent; border: none; cursor: pointer;
      color: var(--muted); padding: 4px; border-radius: 5px;
      display: flex;
    }
    .modal-close:hover { background: #f3f4f6; color: var(--ink-text); }

    .preview-plaque {
      display: flex; align-items: center; gap: 12px;
      margin: 18px 22px 6px;
      padding: 12px 14px;
      background: var(--primary-light);
      border: 1px solid var(--hairline);
      border-radius: 7px;
    }
    .preview-text { min-width: 0; }
    .preview-name {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 14px;
      color: var(--charcoal);
    }
    .preview-loc { font-size: 10.5px; color: var(--muted); margin-top: 2px; }

    .modal-body { padding: 18px 22px; }
    .field { margin-bottom: 15px; }
    .field label {
      display: block; margin-bottom: 6px;
      font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--muted);
    }
    .optional { text-transform: none; font-weight: 400; color: #9ca3af; }
    .form-control {
      width: 100%; padding: 9px 11px;
      border: 1px solid var(--hairline);
      border-radius: 5px;
      font-size: 12.5px;
      font-family: inherit;
      background: white;
      color: var(--charcoal);
    }
    .form-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,58,140,0.1); }
    textarea.form-control { resize: vertical; min-height: 60px; }
    small { display: block; margin-top: 4px; color: #9ca3af; font-size: 10px; }

    .error-bar {
      margin-top: 10px; padding: 9px 12px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: var(--danger);
      border-radius: 5px; font-size: 11px;
    }

    .modal-foot {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 16px 22px;
      border-top: 1px solid var(--hairline);
    }

    /* ---------- delete modal ---------- */
    .delete-card { max-width: 420px; }
    .delete-body { text-align: center; }
    .warning-icon { color: var(--danger); margin-bottom: 8px; }
    .delete-question { font-size: 13.5px; color: var(--charcoal); margin: 0 0 12px; }
    .delete-info {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 12px; margin-bottom: 12px;
      text-align: left; font-size: 12px;
    }
    .delete-info strong { color: var(--charcoal); }
    .delete-sub { color: var(--muted); }
    .warning-text { color: var(--danger) !important; font-size: 11px !important; font-weight: 600; margin: 4px 0 0; }

    /* ---------- toast ---------- */
    .toast {
      position: fixed; bottom: 26px; right: 26px;
      display: flex; align-items: center; gap: 10px;
      background: white;
      border: 1px solid var(--hairline);
      border-left: 3px solid var(--success);
      color: var(--ink-text);
      padding: 12px 18px 12px 14px;
      border-radius: 7px;
      font-size: 12.5px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.12);
      transform: translateY(14px);
      opacity: 0;
      pointer-events: none;
      transition: all .25s ease;
      z-index: 2000;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast.error { border-left-color: var(--danger); }
    .toast-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
    .toast.error .toast-dot { background: var(--danger); }

    /* ---------- company name small text ---------- */
    .branch-company-small {
      font-size: 9px;
      color: var(--muted);
      font-style: italic;
      text-transform: lowercase;
      margin-left: 2px;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .board *, .board *::before, .board *::after { animation: none !important; transition: none !important; }
    }

    /* ---------- responsive ---------- */
    @media (max-width: 720px) {
      .board { padding: 18px; }
      .board-header { flex-direction: column; align-items: flex-start; }
      .directory { flex-direction: column; }
      .alpha-rail {
        position: static;
        flex-direction: row;
        overflow-x: auto;
        width: 100%;
      }
      .roster { padding-left: 16px; }
      .plaque-meta { flex-wrap: wrap; }
      .branch-select { width: 100%; }
      .toast { left: 16px; right: 16px; bottom: 16px; }
    }
  `]
})
export class DepartmentsComponent implements OnInit {
  // Data
  branches: any[] = [];
  departments: any[] = [];
  roles: any[] = [];
  expandedDept: number | null = null;
  selectedBranchId: string = '';

  // Department Form
  showDeptForm = false;
  editingDept: any = null;
  deptForm = { name: '', location: '', branch_id: '' };
  saving = false;
  deptError = '';

  // Role Form
  showRoleForm = false;
  editingRole: any = null;
  roleForm = {
    department_id: '',
    role_name: ''
  };
  savingRole = false;
  roleError = '';

  // Delete
  showDeleteConfirm = false;
  deleteTarget: any = null;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadBranches();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ============================================
  // LOAD DATA
  // ============================================
 loadBranches() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/branches`, { headers }).subscribe({
      next: (data) => {
        this.branches = data || [];
        
        // For non-admin users, auto-select their branch
        const currentUser = JSON.parse(
          localStorage.getItem('currentUser') || 
          sessionStorage.getItem('currentUser') || 
          '{}'
        );
        const userRole = (currentUser.role || '').toLowerCase().trim();
        
        if (userRole !== 'admin' && currentUser.branch_id) {
          // Auto-select user's branch
          this.selectedBranchId = String(currentUser.branch_id);
          // Optionally filter branches to only show user's branch
          // this.branches = this.branches.filter(b => b.id === currentUser.branch_id);
        }
        
        this.loadDepartments();
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.showToastNotification('Failed to load branches', 'error');
        this.loadDepartments();
      }
    });
  }
  loadDepartments() {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/departments`, { headers }).subscribe({
      next: (data) => {
        this.departments = Array.isArray(data) ? data : [];
        this.loadRoles();
      },
      error: (err) => {
        console.error('Failed to load departments:', err);
        this.showToastNotification('Failed to load departments', 'error');
        this.loadRoles();
      }
    });
  }

  loadRoles() {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/department-roles`, { headers }).subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
        this.showToastNotification('Failed to load positions', 'error');
      }
    });
  }

  loadData() {
    this.loadBranches();
  }

  // ============================================
  // BRANCH FILTER
  // ============================================
  get filteredDepartments(): any[] {
    if (!this.selectedBranchId) {
      return [];
    }
    return this.sortedDepartments.filter(d => d.branch_id === Number(this.selectedBranchId));
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

  onBranchChange() {
    this.expandedDept = null;
  }

  // ============================================
  // DEPARTMENT METHODS
  // ============================================
  getRoleCount(deptId: number): number {
    return this.roles.filter(r => r.department_id === deptId).length;
  }

  getRolesByDepartment(deptId: number): any[] {
    return this.roles.filter(r => r.department_id === deptId);
  }

  toggleDepartment(deptId: number) {
    this.expandedDept = this.expandedDept === deptId ? null : deptId;
  }

  get sortedDepartments(): any[] {
    return [...this.departments].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );
  }

  get groupedLetters(): string[] {
    const letters = new Set<string>();
    const depts = this.filteredDepartments;
    for (const dept of depts) {
      letters.add((dept.name || '?').charAt(0).toUpperCase());
    }
    return Array.from(letters).sort();
  }

  scrollToLetter(letter: string) {
    const match = this.filteredDepartments.find(
      d => (d.name || '?').charAt(0).toUpperCase() === letter
    );
    if (match) {
      const el = document.getElementById('dept-' + match.id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openCreateDeptForm() {
    this.editingDept = null;
    this.deptForm = { 
      name: '', 
      location: '', 
      branch_id: this.selectedBranchId || '' 
    };
    this.deptError = '';
    this.showDeptForm = true;
  }

  openEditDeptForm(dept: any) {
    this.editingDept = dept;
    this.deptForm = {
      name: dept.name || '',
      location: dept.location || '',
      branch_id: dept.branch_id || ''
    };
    this.deptError = '';
    this.showDeptForm = true;
  }

  closeDeptForm() {
    this.showDeptForm = false;
    this.editingDept = null;
    this.deptError = '';
    this.saving = false;
  }

  saveDepartment() {
    if (!this.deptForm.name.trim() || !this.selectedBranchId || this.saving) return;
    this.saving = true;
    this.deptError = '';
    const headers = this.getAuthHeaders();

    const payload = {
      name: this.deptForm.name,
      location: this.deptForm.location || '',
      branch_id: Number(this.selectedBranchId)
    };

    const url = this.editingDept
      ? `${environment.apiUrl}/api/departments/${this.editingDept.id}`
      : `${environment.apiUrl}/api/departments`;
    const method = this.editingDept ? 'put' : 'post';

    this.http[method](url, payload, { headers }).subscribe({
      next: () => {
        this.closeDeptForm();
        this.loadDepartments();
        this.showToastNotification(`Department ${this.editingDept ? 'updated' : 'created'}.`, 'success');
      },
      error: (err) => {
        this.saving = false;
        this.deptError = err.error?.error || 'Failed to save department. Please try again.';
      }
    });
  }

  // ============================================
  // ROLE/POSITION METHODS
  // ============================================
  openCreateRoleForm(deptId?: number) {
    this.editingRole = null;
    this.roleForm = {
      department_id: deptId ? String(deptId) : '',
      role_name: ''
    };
    this.roleError = '';
    this.showRoleForm = true;
  }

  openEditRoleForm(role: any) {
    this.editingRole = role;
    this.roleForm = {
      department_id: String(role.department_id || ''),
      role_name: role.role_name || ''
    };
    this.roleError = '';
    this.showRoleForm = true;
  }

  closeRoleForm() {
    this.showRoleForm = false;
    this.editingRole = null;
    this.roleError = '';
    this.savingRole = false;
  }

  saveRole() {
    if (!this.roleForm.department_id || !this.roleForm.role_name || this.savingRole) return;
    this.savingRole = true;
    this.roleError = '';
    const headers = this.getAuthHeaders();

    const dept = this.departments.find(d => d.id === Number(this.roleForm.department_id));

    const payload = {
      department_id: Number(this.roleForm.department_id),
      department_name: dept?.name || '',
      role_name: this.roleForm.role_name,
      role_description: ''
    };

    const url = this.editingRole
      ? `${environment.apiUrl}/api/department-roles/${this.editingRole.id}`
      : `${environment.apiUrl}/api/department-roles`;
    const method = this.editingRole ? 'put' : 'post';

    this.http[method](url, payload, { headers }).subscribe({
      next: () => {
        this.closeRoleForm();
        this.loadRoles();
        if (payload.department_id) {
          this.expandedDept = payload.department_id;
        }
        this.showToastNotification(`Position ${this.editingRole ? 'updated' : 'created'}.`, 'success');
      },
      error: (err) => {
        this.savingRole = false;
        this.roleError = err.error?.error || 'Failed to save position. Please try again.';
      }
    });
  }

  // ============================================
  // DELETE METHODS
  // ============================================
  confirmDeleteDept(dept: any) {
    this.deleteTarget = { type: 'department', data: dept };
    this.showDeleteConfirm = true;
  }

  confirmDeleteRole(role: any) {
    this.deleteTarget = { type: 'role', data: role };
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    const headers = this.getAuthHeaders();

    if (this.deleteTarget.type === 'department') {
      this.http.delete(`${environment.apiUrl}/api/departments/${this.deleteTarget.data.id}`, { headers }).subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.deleteTarget = null;
          this.loadDepartments();
          this.showToastNotification('Department deleted.', 'success');
        },
        error: (err) => {
          this.showDeleteConfirm = false;
          this.deleteTarget = null;
          this.showToastNotification(err.error?.error || 'Failed to delete department', 'error');
        }
      });
    } else if (this.deleteTarget.type === 'role') {
      this.http.delete(`${environment.apiUrl}/api/department-roles/${this.deleteTarget.data.id}`, { headers }).subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.deleteTarget = null;
          this.loadRoles();
          this.showToastNotification('Position deleted.', 'success');
        },
        error: (err) => {
          this.showDeleteConfirm = false;
          this.deleteTarget = null;
          this.showToastNotification('Failed to delete position', 'error');
        }
      });
    }
  }

  // ============================================
  // TOAST NOTIFICATION
  // ============================================
  showToastNotification(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastMessage = '';
    }, 3000);
  }
}