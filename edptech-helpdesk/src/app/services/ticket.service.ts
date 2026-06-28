import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { tap, catchError, timeout, retry } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service'; // ✅ Import AuthService
import { environment } from '../../environments/environment';

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'assigned' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  location?: string;
  department_id?: number;
  department_name?: string;
  branch_id?: number;
  branch_name?: string;
  company_name?: string;
  user_table?: string; 
  created_by?: number;
  created_by_name?: string;
  assigned_to?: number;
  agent_name?: string;
  assigned_users?: any[];
  created_at: string;
  updated_at?: string;
  version?: number; 
  resolved_at?: string;
  creator_department?: string; 
  creator_branch_name?: string;
  creator_company_name?: string;
}

export interface TicketStats {
  total: number;
  open: number;
  critical: number;
  resolvedToday: number;
  byPriority: { [key: string]: number };
  byStatus: { [key: string]: number };
  byDepartment: { [key: string]: number };
  slaCompliance: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private apiUrl = `${environment.apiUrl}/api`;
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();
  private statsSubject = new BehaviorSubject<TicketStats | null>(null);
  public stats$ = this.statsSubject.asObservable();
  private pollingInterval: any;
  private pollingEnabled = true;
  private previousTickets: Ticket[] = [];
  private lastCheckTime = new Date();
  private ticketUpdateSubject = new Subject<Ticket>();
  public ticketUpdate$ = this.ticketUpdateSubject.asObservable();
  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private notificationService: NotificationService,
    private authService: AuthService  // ✅ Add AuthService here
  ) {
    this.loadInitialData();
  }
pausePolling(): void {
  this.pollingEnabled = false;
  console.log('⏸️ Polling paused');
}

resumePolling(): void {
  this.pollingEnabled = true;
  console.log('▶️ Polling resumed');
}

private startPolling(): void {
  if (this.pollingInterval) {
    clearInterval(this.pollingInterval);
  }
  this.pollingInterval = setInterval(() => {
    if (this.pollingEnabled) {
      this.fetchTickets(); 
    } else {
      console.log('⏸️ Polling skipped (paused)');
    }
  }, 30000);
}

 private loadInitialData(): void {
  const cachedTickets = this.cacheService.get('tickets');
  if (cachedTickets) {
    this.ticketsSubject.next(cachedTickets);
    this.calculateStats(cachedTickets);
  }
  this.fetchTickets();
  this.startPolling();  // ✅ Start polling
}

 private checkForNewTickets(): void {
  const currentUser: any = this.authService.getCurrentUser();
  
  if (!currentUser) return;
  
  const userRole = this.determineUserRole(currentUser);
  
  const params: any = {
    userId: currentUser.id,
    userTable: currentUser.user_table || 'users',
    role: userRole,
    departmentId: currentUser.department_id || ''
  };
  
  if (currentUser.branch_id) {
    params.branchId = currentUser.branch_id;
  }
  
  // Use the FILTERED endpoint, not the generic /api/tickets
  this.http.get<Ticket[]>(`${this.apiUrl}/tickets/my`, { params })
    .pipe(timeout(5000), catchError(() => of([] as Ticket[])))
    .subscribe(currentTickets => {
      this.detectChanges(this.previousTickets, currentTickets);
      this.previousTickets = currentTickets;
      
      // Only update if there are actual changes
      if (this.hasTicketDataChanged(currentTickets)) {
        this.ticketsSubject.next(currentTickets);
        this.cacheService.set('tickets', currentTickets);
        this.calculateStats(currentTickets);
      }
      this.lastCheckTime = new Date();
    });
}
private hasTicketDataChanged(newTickets: Ticket[]): boolean {
  const currentStored = this.ticketsSubject.value;
  if (currentStored.length !== newTickets.length) return true;
  
  const oldFingerprint = currentStored.map(t => `${t.id}:${t.status}:${t.assigned_to}:${t.priority}`).sort().join(',');
  const newFingerprint = newTickets.map(t => `${t.id}:${t.status}:${t.assigned_to}:${t.priority}`).sort().join(',');
  
  return oldFingerprint !== newFingerprint;
}
  private detectChanges(oldTickets: Ticket[], newTickets: Ticket[]): void {
    const oldMap = new Map(oldTickets.map(t => [t.id, t]));
    const newMap = new Map(newTickets.map(t => [t.id, t]));

    for (const [id, ticket] of newMap) {
        // Skip notifications entirely - they're handled by components directly
        // Just emit update events so the UI refreshes
        
        if (!oldMap.has(id)) {
            // New ticket - emit event for UI refresh
            this.ticketUpdateSubject.next(ticket);
            continue;
        }

        const oldTicket = oldMap.get(id)!;

        // Emit update event for any changes
        if (oldTicket.status !== ticket.status || 
            oldTicket.assigned_to !== ticket.assigned_to ||
            JSON.stringify(oldTicket.assigned_users) !== JSON.stringify(ticket.assigned_users)) {
            this.ticketUpdateSubject.next(ticket);
        }
    }
}

  // Helper methods
  private getCurrentUserId(): number | null {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.id || null;
    } catch { return null; }
  }

  private getCurrentUserName(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.fullname || null;
    } catch { return null; }
  }

  private getUserName(userId: number | null): string | null {
    if (!userId) return null;
    // Try to find from ticketsSubject
    const tickets = this.ticketsSubject.value;
    const ticket = tickets.find(t => t.assigned_to === userId || t.created_by === userId);
    return ticket?.agent_name || ticket?.created_by_name || null;
  }

  // ✅ Fixed fetchTickets method
 fetchTickets(): void {
  const currentUser: any = this.authService.getCurrentUser();
  
  if (!currentUser) {
    this.fetchAllTickets();
    return;
  }
  
  // Determine user role and department
  const userRole = this.determineUserRole(currentUser);
  const departmentId = currentUser.department_id || '';
  
  const params: any = {
    userId: currentUser.id,
    userTable: currentUser.user_table || 'users',
    role: userRole,
    departmentId: departmentId
  };
  
  if (currentUser.branch_id) {
    params.branchId = currentUser.branch_id;
  }
  
  console.log('📤 Sending params to /api/tickets/my:', params);
  
  // ✅ Get current tickets to preserve assigned_users
  const currentTickets = this.ticketsSubject.value;
  
  this.http.get<Ticket[]>(`${this.apiUrl}/tickets/my`, { params }).subscribe({
    next: (tickets) => {
      // ✅ Preserve assigned_users from existing tickets
      const updatedTickets = tickets.map(t => {
        const existing = currentTickets.find(ct => ct.id === t.id);
        if (existing && existing.assigned_users && existing.assigned_users.length > 0) {
          // ✅ Keep the existing assigned_users if the new one is empty
          if (!t.assigned_users || t.assigned_users.length === 0) {
            return { ...t, assigned_users: existing.assigned_users };
          }
        }
        // Parse assigned_users if it's a string
        if (typeof t.assigned_users === 'string') {
          try {
            t.assigned_users = JSON.parse(t.assigned_users);
          } catch (e) {
            t.assigned_users = [];
          }
        }
        return t;
      });
      
      console.log(`📥 Received ${updatedTickets.length} tickets from backend`);
      this.ticketsSubject.next(updatedTickets);
      this.cacheService.set('tickets', updatedTickets);
      this.calculateStats(updatedTickets);
    },
    error: (error) => {
      console.error('❌ Error fetching tickets:', error);
      if (this.ticketsSubject.value.length === 0) {
        this.fetchAllTickets();
      }
    }
  });
}
// Client-side comment methods
addClientComment(ticketId: number, comment: string, isInternal: boolean, userId?: number, userTable?: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/client/tickets/${ticketId}/comments`, { 
    comment, 
    is_internal: isInternal,
    user_id: userId,
    user_table: userTable
  });
}

getClientComments(ticketId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/client/tickets/${ticketId}/comments?t=${new Date().getTime()}`);
}

deleteClientComment(commentId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/client/tickets/comments/${commentId}`);
}
private determineUserRole(user: any): string {
  if (!user) return 'user';
  
  const deptName = (user.department || user.department_name || '').toLowerCase().trim();
  const branchId = user.branch_id;
  const userTable = user.user_table || '';
  
  console.log('🔍 determineUserRole - Input:', { 
    role: user.role, 
    department: deptName, 
    branchId: branchId,
    userTable: userTable
  });
  
  // ✅ FIX: Check if user is from 'users' table (EDP/IT staff)
  if (userTable === 'users') {
    // ALL users from 'users' table are EDP/IT staff
    console.log('👤 User from users table - EDP/IT staff');
    
    // Check if user is from main branch (1 or 5)
    if (branchId === 1 || branchId === 5) {
      console.log('📌 Main branch EDP/IT');
      return 'main_edp_it';
    }
    console.log('📌 Branch EDP/IT');
    return 'edp_it';
  }
  
  // Users from 'new_user' table are clients
  console.log('👤 User from new_user table - Client');
  return 'user';
}
private isEDPITDepartment(deptName: string): boolean {
  if (!deptName) return false;
  const name = deptName.toLowerCase();
  return name === 'edp' || name === 'it' || name === 'edp/it' || 
         name === 'it/edp' || name.includes('edp') || name.includes('it');
}
  private fetchAllTickets(): void {
    this.http.get<Ticket[]>(`${this.apiUrl}/tickets`).subscribe({
      next: (tickets) => {
        this.ticketsSubject.next(tickets);
        this.cacheService.set('tickets', tickets);
        this.calculateStats(tickets);
      },
      error: (error) => {
        console.error('Error fetching tickets:', error);
      }
    });
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/tickets`);
  }
  
  getTicket(id: number): Observable<Ticket> {
    // Check cache first
    const cached = this.cacheService.get(`ticket_${id}`);
    if (cached) {
      return of(cached);
    }
    
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${id}`)
      .pipe(
        timeout(10000),
        retry(2),
        tap(ticket => this.cacheService.set(`ticket_${id}`, ticket, 2 * 60 * 1000))
      );
  }
private newTicketSubject = new Subject<Ticket>();
public newTicket$ = this.newTicketSubject.asObservable();
  // createTicket method with better error logging and location field
 createTicket(ticketData: any): Observable<Ticket> {
  console.log('📤 createTicket - raw data:', ticketData);
  
  const payload = {
    title: ticketData.title,
    description: ticketData.description,
    priority: ticketData.priority,
    location: ticketData.location,
    department_id: ticketData.department_id,
    created_by: ticketData.created_by,
    created_by_name: ticketData.created_by_name
  };
  
  console.log('📤 createTicket - payload:', payload);
  
  return this.http.post<Ticket>(`${this.apiUrl}/tickets`, payload)
    .pipe(
      tap(newTicket => {
        console.log('✅ Ticket created:', newTicket);
        this.notificationService.handleNewTicket(newTicket);
        const current = this.ticketsSubject.value;
        this.ticketsSubject.next([newTicket, ...current]);
        this.newTicketSubject.next(newTicket);     // ✅ Emit to new ticket subject
        this.ticketUpdateSubject.next(newTicket);   // ✅ Also emit to update subject
        this.cacheService.remove('tickets');
        this.calculateStats([newTicket, ...current]);
      }),
      catchError(error => {
        console.error('❌ Create error:', error);
        return this.handleError<Ticket>({} as Ticket)(error);
      })
    );
}
  // In ticket.service.ts
// In ticket.service.ts
updateTicket(id: number, data: any): Observable<Ticket> {
  console.log('Updating ticket:', id, data);
  
  // ✅ Ensure assigned_users is preserved in the payload
  if (data.assigned_users && Array.isArray(data.assigned_users)) {
    data.assigned_users = JSON.stringify(data.assigned_users);
  }
  
  return this.http.put<Ticket>(`${this.apiUrl}/tickets/${id}`, data)
    .pipe(
      tap(updatedTicket => {
        console.log('Ticket updated successfully:', updatedTicket);
        
        // ✅ Parse assigned_users if it's a string
        if (typeof updatedTicket.assigned_users === 'string') {
          try {
            updatedTicket.assigned_users = JSON.parse(updatedTicket.assigned_users);
          } catch (e) {
            updatedTicket.assigned_users = [];
          }
        }
        
        const current = this.ticketsSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          // ✅ Preserve the assigned_users from the update
          current[index] = {
            ...updatedTicket,
            assigned_users: data.assigned_users || updatedTicket.assigned_users || []
          };
          this.ticketsSubject.next([...current]);
        }
        this.ticketUpdateSubject.next(updatedTicket);
        this.cacheService.remove(`ticket_${id}`);
        this.cacheService.remove('tickets');
        this.calculateStats(current);
      }),
      catchError(error => {
        console.error('Update error details:', error);
        return this.handleError<Ticket>({} as Ticket)(error);
      })
    );
}


  addComment(ticketId: number, comment: string, isInternal: boolean, userId?: number, userTable?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${ticketId}/comments`, { 
      comment, 
      is_internal: isInternal,
      user_id: userId,
      user_table: userTable
    });
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tickets/comments/${commentId}`);
  }

  private calculateStats(tickets: Ticket[]): void {
    const now = new Date();
    const today = now.toDateString();
    
    const stats: TicketStats = {
      total: tickets.length,
      open: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
      critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length,
      resolvedToday: tickets.filter(t => 
        t.status === 'resolved' && 
        t.resolved_at && 
        new Date(t.resolved_at).toDateString() === today
      ).length,
      byPriority: {},
      byStatus: {},
      byDepartment: {},
      slaCompliance: 98,
      avgResponseTime: 0,
      avgResolutionTime: 0
    };

    // Calculate by priority
    tickets.forEach(t => {
      stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1;
      stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
      if (t.department_name) {
        stats.byDepartment[t.department_name] = (stats.byDepartment[t.department_name] || 0) + 1;
      }
    });

    this.statsSubject.next(stats);
  }

  getComments(ticketId: number): Observable<any[]> {
    // Add a cache-busting timestamp to prevent caching
    return this.http.get<any[]>(`${this.apiUrl}/tickets/${ticketId}/comments?t=${new Date().getTime()}`);
  }

  getAttachments(ticketId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets/${ticketId}/attachments`);
  }

  uploadAttachment(ticketId: number, file: File, uploadedBy?: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (uploadedBy) {
      formData.append('uploaded_by', uploadedBy.toString());
    }
    return this.http.post(`${this.apiUrl}/tickets/${ticketId}/attachments`, formData);
  }

  deleteAttachment(attachmentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tickets/attachments/${attachmentId}`);
  }

  deleteTicket(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/tickets/${id}`)
    .pipe(
      tap(() => {
        const current = this.ticketsSubject.value;
        const deletedTicket = current.find(t => t.id === id);
        this.ticketsSubject.next(current.filter(t => t.id !== id));
        if (deletedTicket) {
          this.ticketUpdateSubject.next({ ...deletedTicket, status: 'deleted' } as any);  // ✅ Notify
        }
        this.cacheService.remove(`ticket_${id}`);
        this.cacheService.remove('tickets');
        this.calculateStats(current.filter(t => t.id !== id));
      }),
        catchError(error => {
          console.error('Delete error:', error);
          return this.handleError<any>(null)(error);
        })
      );
  }

  private handleError<T>(result?: T) {
    return (error: any): Observable<T> => {
      console.error('API Error:', error);
      return of(result as T);
    };
  }
}