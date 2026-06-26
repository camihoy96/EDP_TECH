// src/app/services/client-ticket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { tap, catchError, timeout } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { ClientNotificationService } from './client-notification.service';
import { AuthService } from './auth.service';
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
export class ClientTicketService {
  private apiUrl = `${environment.apiUrl}/api`;
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();
  private statsSubject = new BehaviorSubject<TicketStats | null>(null);
  public stats$ = this.statsSubject.asObservable();
  private pollingInterval: any;
  private pollingEnabled = true;
  private previousTickets: Ticket[] = [];
  private ticketUpdateSubject = new Subject<Ticket>();
  public ticketUpdate$ = this.ticketUpdateSubject.asObservable();
  private newTicketSubject = new Subject<Ticket>();
  public newTicket$ = this.newTicketSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private clientNotificationService: ClientNotificationService,
    private authService: AuthService
  ) {
    this.loadInitialData();
  }

  pausePolling(): void {
    this.pollingEnabled = false;
    console.log('⏸️ Client polling paused');
  }

  resumePolling(): void {
    this.pollingEnabled = true;
    console.log('▶️ Client polling resumed');
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.pollingInterval = setInterval(() => {
      if (this.pollingEnabled) {
        this.fetchTickets();
      }
    }, 30000);
  }

  private loadInitialData(): void {
    const cachedTickets = this.cacheService.get('client_tickets');
    if (cachedTickets) {
      this.ticketsSubject.next(cachedTickets);
      this.calculateStats(cachedTickets);
    }
    this.fetchTickets();
    this.startPolling();
  }

// src/app/services/client-ticket.service.ts
fetchTickets(): void {
    const currentUser: any = this.authService.getCurrentUser();
    
    if (!currentUser) {
        console.warn('⚠️ No user found, cannot fetch client tickets');
        return;
    }

    console.log('👤 Current user:', {
        id: currentUser.id,
        department: currentUser.department,
        department_id: currentUser.department_id,
        branch_id: currentUser.branch_id,
        role: currentUser.role
    });

    // ✅ Build params WITHOUT role
    const params: any = {
        userId: currentUser.id,
        userTable: currentUser.user_table || 'new_user',
        includeAssignedUsers: 'false'
    };

    if (currentUser.branch_id) {
        params.branchId = currentUser.branch_id;
    }
    
    if (currentUser.department_id) {
        params.departmentId = currentUser.department_id;
    }

    console.log('📤 Fetching client tickets with params:', params);

    this.http.get<Ticket[]>(`${this.apiUrl}/client/tickets`, { params })
        .pipe(
            timeout(10000),
            tap(tickets => {
                console.log(`📥 Received ${tickets?.length || 0} tickets from backend`);
                console.log('📥 First ticket sample:', tickets?.[0]?.ticket_number);
            }),
            catchError(error => {
                console.error('❌ Client fetch error:', error);
                return of([] as Ticket[]);
            })
        ).subscribe({
            next: (tickets) => {
                console.log(`✅ Processing ${tickets.length} tickets`);
                
                const parsedTickets = tickets.map(t => {
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

                console.log('📋 Pushing to ticketsSubject:', parsedTickets.length);
                this.ticketsSubject.next(parsedTickets);
                this.cacheService.set('client_tickets', parsedTickets);
                this.calculateStats(parsedTickets);
                this.checkForUpdates(parsedTickets);
            },
            error: (err) => {
                console.error('❌ Subscription error:', err);
            }
        });
}
  private checkForUpdates(newTickets: Ticket[]): void {
    const oldTickets = this.previousTickets;
    const oldMap = new Map(oldTickets.map(t => [t.id, t]));
    const newMap = new Map(newTickets.map(t => [t.id, t]));

    for (const [id, ticket] of newMap) {
      // NEW ticket
      if (!oldMap.has(id)) {
        if (ticket.status === 'new' && ticket.created_by === this.authService.getCurrentUser()?.id) {
          this.clientNotificationService.handleNewTicket(ticket);
        }
        continue;
      }

      const oldTicket = oldMap.get(id)!;

      // STATUS CHANGES
      if (oldTicket.status !== ticket.status) {
        this.clientNotificationService.handleStatusChange(
          ticket,
          ticket.status,
          ticket.agent_name || 'Administrator',
          ticket.created_by
        );
      }

      // ASSIGNED
      if (oldTicket.assigned_to !== ticket.assigned_to && ticket.assigned_to) {
        const assignedToName = ticket.agent_name || `Agent #${ticket.assigned_to}`;
        this.clientNotificationService.handleTicketAssigned(
          ticket,
          ticket.agent_name || 'Administrator',
          ticket.created_by,
          assignedToName
        );
      }
    }

    this.previousTickets = newTickets;
  }

  // ✅ UPDATED: Use /api/client/tickets/:id endpoint
  getTicket(id: number): Observable<Ticket> {
    const cached = this.cacheService.get(`client_ticket_${id}`);
    if (cached) {
      return of(cached);
    }

    return this.http.get<Ticket>(`${this.apiUrl}/client/tickets/${id}`)
      .pipe(
        timeout(10000),
        tap(ticket => {
          if (typeof ticket.assigned_users === 'string') {
            try {
              ticket.assigned_users = JSON.parse(ticket.assigned_users);
            } catch (e) {
              ticket.assigned_users = [];
            }
          }
          this.cacheService.set(`client_ticket_${id}`, ticket, 2 * 60 * 1000);
        }),
        catchError(this.handleError<Ticket>({} as Ticket))
      );
  }

  createTicket(ticketData: any): Observable<Ticket> {
    console.log('📤 Client create ticket:', ticketData);
    
    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      location: ticketData.location,
      department_id: ticketData.department_id,
      created_by: ticketData.created_by,
      created_by_name: ticketData.created_by_name
    };

    return this.http.post<Ticket>(`${this.apiUrl}/tickets`, payload)
      .pipe(
        tap(newTicket => {
          console.log('✅ Client ticket created:', newTicket);
          const current = this.ticketsSubject.value;
          this.ticketsSubject.next([newTicket, ...current]);
          this.newTicketSubject.next(newTicket);
          this.ticketUpdateSubject.next(newTicket);
          this.cacheService.remove('client_tickets');
          this.calculateStats([newTicket, ...current]);
        }),
        catchError(error => {
          console.error('❌ Client create error:', error);
          return this.handleError<Ticket>({} as Ticket)(error);
        })
      );
  }

  // src/app/services/client-ticket.service.ts

updateTicket(id: number, data: any): Observable<Ticket> {
    console.log('📤 Client updating ticket:', id, data);
    
    if (data.assigned_users && Array.isArray(data.assigned_users)) {
      data.assigned_users = JSON.stringify(data.assigned_users);
    }

    // ✅ Use client-specific endpoint
    return this.http.put<Ticket>(`${this.apiUrl}/client/tickets/${id}`, data)
      .pipe(
        tap(updatedTicket => {
          console.log('✅ Client ticket updated:', updatedTicket);
          
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
            current[index] = {
              ...updatedTicket,
              assigned_users: updatedTicket.assigned_users || []
            };
            this.ticketsSubject.next([...current]);
          }
          
          this.ticketUpdateSubject.next(updatedTicket);
          this.cacheService.remove(`client_ticket_${id}`);
          this.cacheService.remove('client_tickets');
          this.calculateStats(current);
        }),
        catchError(error => {
          console.error('❌ Client update error:', error);
          return this.handleError<Ticket>({} as Ticket)(error);
        })
      );
  }
  deleteTicket(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/client/tickets/${id}`)
      .pipe(
        tap(() => {
          const current = this.ticketsSubject.value;
          const deletedTicket = current.find(t => t.id === id);
          this.ticketsSubject.next(current.filter(t => t.id !== id));
          if (deletedTicket) {
            this.ticketUpdateSubject.next({ ...deletedTicket, status: 'deleted' } as any);
          }
          
          // ✅ Refresh the full list from backend
          this.fetchTickets();
          
          this.cacheService.remove(`client_ticket_${id}`);
          this.cacheService.remove('client_tickets');
          this.calculateStats(current.filter(t => t.id !== id));
        }),
        catchError(error => {
          console.error('❌ Client delete error:', error);
          return this.handleError<any>(null)(error);
        })
      );
  }
  addComment(ticketId: number, comment: string, isInternal: boolean, userId?: number, userTable?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/client/tickets/${ticketId}/comments`, {
      comment,
      is_internal: isInternal,
      user_id: userId,
      user_table: userTable || 'new_user'
    });
  }

  getComments(ticketId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client/tickets/${ticketId}/comments?t=${new Date().getTime()}`);
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/client/tickets/comments/${commentId}`);
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

    tickets.forEach(t => {
      stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1;
      stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
      if (t.department_name) {
        stats.byDepartment[t.department_name] = (stats.byDepartment[t.department_name] || 0) + 1;
      }
    });

    this.statsSubject.next(stats);
  }

  private handleError<T>(result?: T) {
    return (error: any): Observable<T> => {
      console.error('Client API Error:', error);
      return of(result as T);
    };
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}