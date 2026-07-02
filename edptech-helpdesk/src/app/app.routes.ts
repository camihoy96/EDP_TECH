import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupPageComponent } from './components/login/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { ClientTicketListComponent } from './components/client-tickets/client-ticket-list.component';
import { ClientTicketFormComponent } from './components/client-tickets/client-ticket-form.component';
import { ClientTicketDetailComponent } from './components/client-tickets/client-ticket-detail.component';
import { TicketListComponent } from './components/tickets/ticket-list/ticket-list.component';
import { TicketFormComponent } from './components/tickets/ticket-form/ticket-form.component';
import { TicketDetailComponent } from './components/tickets/ticket-detail/ticket-detail.component';
import { KnowledgeBaseComponent } from './components/knowledge-base/knowledge-base.component';
import { KnowledgeBaseAdminComponent } from './components/knowledge-base/knowledge-base-admin.component';
import { AnnouncementsComponent } from './components/announcements/announcements.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { ProfileComponent } from './components/manage/profile.component';
import { ClientProfileComponent } from './components/client-manage/client-profile.component';
import { DepartmentRolesComponent } from './components/admin/admin-panel/department-roles.component';
import { ClientJobOrderFormComponent } from './components/client-tickets/client-job-order-form.component';
import { ClientJobOrderListComponent } from './components/client-tickets/client-job-order-list.component';
import { ClientRequisitionFormComponent } from './components/client-tickets/client-requisition-form.component';
import { ClientRequisitionListComponent } from './components/client-tickets/client-requisition-list.component';
import { PhpMyAdminViewerComponent } from './components/admin/admin-panel/phpmyadmin-viewer.component';
import { AdminAboutComponent } from './components/admin/admin-panel/about.component';
import { AdminDocumentationComponent } from './components/admin/admin-panel/documents.component';
import { AdminShortcutsComponent } from './components/admin/admin-panel/shortcuts.component';
import { AdminUpdatesComponent } from './components/admin/admin-panel/updates.component';
import { AdminSupportComponent } from './components/admin/admin-panel/support.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { ClientFeaturesComponent } from './components/client/features/features.component';
import { AdminRequisitionFormComponent } from './components/admin/admin-panel/requisition-form.component';
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
   { path: 'signup', component: SignupPageComponent },
  // ✅ CCTV Route - MUST be here at ROOT level (outside dashboard)
  {
    path: 'cctv-info',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/admin/admin-panel/cctv-info.component').then(m => m.CctvDashboardComponent)
  },
  
  { path: 'auth/callback', component: AuthCallbackComponent },
  // Admin/IT routes with Dashboard layout
 {
  path: '',
  canActivate: [AuthGuard],
  children: [
    {
      path: '',
      component: DashboardComponent,
      canActivate: [RoleGuard],
      data: { role: ['admin', 'Technician', 'Head/Manager','Staff'] },
      children: [
      { path: 'dashboard', component: TicketListComponent },
      { path: 'tickets', component: TicketListComponent },
      { path: 'tickets/new', component: TicketFormComponent },
      { path: 'tickets/:id/edit', component: TicketFormComponent },
      { path: 'tickets/:id', component: TicketDetailComponent },
       { path: 'features', component: ClientFeaturesComponent },
      // Knowledge Base routes
      { path: 'knowledge-base', component: KnowledgeBaseComponent },
      { path: 'knowledge-base/create', component: KnowledgeBaseAdminComponent },
      { path: 'knowledge-base/edit', component: KnowledgeBaseAdminComponent },
       { path: 'requisitions/new', loadComponent: () => import('./components/admin/admin-panel/requisition-form.component').then(m => m.AdminRequisitionFormComponent) },
    { path: 'requisitions/edit', loadComponent: () => import('./components/admin/admin-panel/requisition-form.component').then(m => m.AdminRequisitionFormComponent) },
      { path: 'profile', component: ProfileComponent },
      
      // ❌ REMOVE THIS - It's now at the root level
      // {
      //   path: 'cctv-info',
      //   canActivate: [AuthGuard],
      //   loadComponent: () => import('./components/admin/admin-panel/cctv-info.component').then(m => m.CctvDashboardComponent)
      // },
      
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { role: ['admin', 'Technician', 'Head/Manager','Staff'] },
        children: [
          { 
            path: 'users-management', 
            loadComponent: () => import('./components/admin/admin-panel/user-management.component').then(m => m.UserManagementComponent) 
          },
          {
            path: 'job-orders',
            loadComponent: () => import('./components/admin/admin-panel/job-orders-management.component').then(m => m.JobOrdersManagementComponent)
          },
          {
            path: 'reports',
            loadComponent: () => import('./components/admin/admin-panel/reports.component').then(m => m.ReportsComponent)
          },
          {
            path: 'job-orders/approve',
            loadComponent: () => import('./components/client-tickets/client-job-order-form.component').then(m => m.ClientJobOrderFormComponent)
          },
        { 
          path: 'requisitions/approve', 
          loadComponent: () => import('./components/admin/admin-panel/requisition-form.component').then(m => m.AdminRequisitionFormComponent) 
        },
          {
            path: 'requisitions',
            loadComponent: () => import('./components/admin/admin-panel/requisitions-management.component').then(m => m.RequisitionsManagementComponent)
          },
          {
            path: 'department-roles',
            component: DepartmentRolesComponent
          },
          {
            path: 'registration-keys',
            loadComponent: () => import('./components/admin/admin-panel/registration-keys.component').then(m => m.RegistrationKeysComponent)
          },
          {
            path: 'departments',
            loadComponent: () => import('./components/admin/admin-panel/departments.component').then(m => m.DepartmentsComponent)
          },
          { 
            path: 'computer-monitoring', 
            loadComponent: () => import('./components/admin/admin-panel/computer-monitoring.component').then(m => m.ComputerMonitoringComponent) 
          },
          {
            path: 'phpmyadmin',
            component: PhpMyAdminViewerComponent
          },
          {
            path: 'chat',
            loadComponent: () => import('./components/admin/admin-panel/chat.component').then(m => m.ChatComponent)
          },
          {
            path: 'settings',
            canActivate: [RoleGuard],
            data: { role: ['admin'] },
            loadComponent: () => import('./components/admin/admin-panel/settings.component').then(m => m.SettingsComponent)
          },
          { 
            path: 'database', 
            loadComponent: () => import('./components/admin/admin-panel/database-management.component').then(m => m.DatabaseManagementComponent) 
          },
          { 
            path: 'logs', 
            loadComponent: () => import('./components/admin/admin-panel/system-logs.component').then(m => m.SystemLogsComponent) 
          },
          { 
            path: 'system-health', 
            loadComponent: () => import('./components/admin/admin-panel/system-health.component').then(m => m.SystemHealthComponent) 
          },
          { path: '', redirectTo: 'users', pathMatch: 'full' },
        ]
      },
      {
  path: 'admin/about',
  component: AdminAboutComponent
},
{
  path: 'admin/documentation',
  component: AdminDocumentationComponent
},
{
  path: 'admin/shortcuts',
  component: AdminShortcutsComponent
},
{
  path: 'admin/updates',
  component: AdminUpdatesComponent
},
{
  path: 'admin/support',
  component: AdminSupportComponent
},
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }
      ]
    }
  ]
},   
  // Client/Employee routes
  {
    path: 'client',
  
    component: ClientDashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: ClientTicketListComponent },
      { path: 'tickets', component: ClientTicketListComponent },
      { path: 'tickets/new', component: ClientTicketFormComponent },
      { path: 'tickets/:id', component: ClientTicketDetailComponent },
      { path: 'tickets/:id/edit', component: ClientTicketFormComponent },
      { path: 'announcements', component: AnnouncementsComponent },
      { path: 'knowledge-base', component: KnowledgeBaseComponent },
      { path: 'profile', component: ClientProfileComponent }, 
      { path: 'job-orders', component: ClientJobOrderListComponent }, 
      { path: 'job-orders/new', component: ClientJobOrderFormComponent },
      { path: 'job-orders/edit', component: ClientJobOrderFormComponent },
      { path: 'request', component: ClientRequisitionListComponent },
      { path: 'request/new', component: ClientRequisitionFormComponent },
      { path: 'request/edit', component: ClientRequisitionFormComponent },
      { path: 'sla-info', loadComponent: () => import('./components/client-dashboard/client-sla-info.component').then(m => m.ClientSlaInfoComponent) },
      { path: 'contact', loadComponent: () => import('./components/client-dashboard/client-contact.component').then(m => m.ClientContactComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'about', loadComponent: () => import('./components/client-dashboard/client-about.component').then(m => m.ClientAboutComponent) },
      { path: 'shortcuts', loadComponent: () => import('./components/client-dashboard/client-shortcuts.component').then(m => m.ClientShortcutsComponent) },
      { path: 'features', component: ClientFeaturesComponent }, 
      { path: 'client/request/approve', component: ClientRequisitionFormComponent },
    ]
  },

  { path: '**', redirectTo: '/login' }
];