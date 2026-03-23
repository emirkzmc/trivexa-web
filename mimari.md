# Trivexa Web - Dosya Mimarisi

Aşağıda `trivexa-web` projesinin kök dizini (root) ile birlikte tüm dosya/klasör ağaç mimarisi bulunmaktadır.

```text
trivexa-web/
├── public
│   ├── vite.svg
│   ├── WebIcon.svg
│   └── WebIcon2.svg
├── src
│   ├── app
│   │   └── router
│   │       └── guards
│   │           ├── index.ts
│   │           ├── PrivateRoute.tsx
│   │           └── RoleGuard.tsx
│   ├── assets
│   │   ├── icons
│   │   │   ├── BildirimIcon.svg
│   │   │   ├── CheckIcon.svg
│   │   │   ├── DashboardIcon.svg
│   │   │   ├── DollaSignIcon.svg
│   │   │   ├── FileIcon.svg
│   │   │   ├── FolderIcon.svg
│   │   │   ├── icon-sidebar.svg
│   │   │   ├── ListIcon.svg
│   │   │   ├── PaperIcon.svg
│   │   │   ├── PersonIcon.svg
│   │   │   ├── SettingsIcon.svg
│   │   │   ├── TeamIcon.svg
│   │   │   └── TimeTrackerIcon.svg
│   │   ├── Logo.svg
│   │   └── WebIcon2.svg
│   ├── features
│   │   ├── audit
│   │   │   ├── api
│   │   │   │   └── audit.api.ts
│   │   │   └── components
│   │   │       └── AuditLogPage.tsx
│   │   ├── auth
│   │   │   ├── api
│   │   │   │   └── auth.api.ts
│   │   │   ├── components
│   │   │   │   ├── ui
│   │   │   │   │   ├── AuthCard.tsx
│   │   │   │   │   ├── AuthLayout.tsx
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Icon.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Label.tsx
│   │   │   │   │   └── Loading.tsx
│   │   │   │   ├── FirstLoginPage.tsx
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── hooks
│   │   │   │   ├── useChangePassword.ts
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useLogout.ts
│   │   │   └── store
│   │   │       └── authStore.ts
│   │   ├── campaigns
│   │   │   ├── api
│   │   │   │   └── campaigns.api.ts
│   │   │   └── components
│   │   │       ├── CampaignFormModal.tsx
│   │   │       └── CampaignsPage.tsx
│   │   ├── clients
│   │   │   ├── api
│   │   │   │   └── clients.api.ts
│   │   │   ├── components
│   │   │   │   ├── ClientDetailPage.tsx
│   │   │   │   ├── ClientFormModal.tsx
│   │   │   │   ├── ClientsPage.tsx
│   │   │   │   ├── ClientsTable.tsx
│   │   │   │   ├── LandingContactRequestsPage.tsx
│   │   │   │   └── LandingContactRequestsTable.tsx
│   │   │   └── hooks
│   │   │       ├── useClientMutations.ts
│   │   │       └── useClients.ts
│   │   ├── code-processes
│   │   │   └── components
│   │   │       └── CodeProcessesPage.tsx
│   │   ├── content-plan
│   │   │   └── components
│   │   │       └── ContentPlanPage.tsx
│   │   ├── contracts
│   │   │   ├── api
│   │   │   │   └── contracts.api.ts
│   │   │   └── components
│   │   │       └── ContractsPage.tsx
│   │   ├── customer-panel
│   │   │   ├── api
│   │   │   │   ├── customerContracts.api.ts
│   │   │   │   └── customerProjects.api.ts
│   │   │   └── components
│   │   │       ├── CustomerPanelContractsPage.tsx
│   │   │       ├── CustomerPanelDashboardPage.tsx
│   │   │       ├── CustomerPanelLayout.tsx
│   │   │       ├── CustomerPanelPlaceholderPage.tsx
│   │   │       ├── CustomerPanelProjectDetailPage.tsx
│   │   │       └── CustomerPanelProjectsPage.tsx
│   │   ├── customer-portal
│   │   │   ├── api
│   │   │   │   └── portal.api.ts
│   │   │   ├── hooks
│   │   │   │   └── usePortalAuth.ts
│   │   │   ├── lib
│   │   │   │   └── portalAxios.ts
│   │   │   └── store
│   │   │       └── portalStore.ts
│   │   ├── dashboard
│   │   │   └── components
│   │   │       └── AdminDashboardPage.tsx
│   │   ├── departments
│   │   │   ├── api
│   │   │   │   └── departments.api.ts
│   │   │   └── components
│   │   │       ├── DepartmentAssignmentsPage.tsx
│   │   │       └── DepartmentsPage.tsx
│   │   ├── design-processes
│   │   │   └── components
│   │   │       └── DesignProcessesPage.tsx
│   │   ├── files
│   │   │   ├── api
│   │   │   │   └── files.api.ts
│   │   │   └── components
│   │   │       └── FilesManagementPage.tsx
│   │   ├── finance
│   │   │   ├── api
│   │   │   │   ├── cashflow.api.ts
│   │   │   │   ├── expenses.api.ts
│   │   │   │   ├── invoices.api.ts
│   │   │   │   └── payments.api.ts
│   │   │   ├── components
│   │   │   │   ├── BankReconciliationPage.tsx
│   │   │   │   ├── CashflowDashboardPage.tsx
│   │   │   │   ├── CollectionTrackingPage.tsx
│   │   │   │   ├── CustomerStatementPage.tsx
│   │   │   │   ├── ExpenseManagementPage.tsx
│   │   │   │   ├── FinanceModulePage.tsx
│   │   │   │   ├── InvoiceDetailPage.tsx
│   │   │   │   ├── InvoicesPage.tsx
│   │   │   │   ├── PayrollAttendancePage.tsx
│   │   │   │   └── TaxDeclarationPrepPage.tsx
│   │   │   └── utils
│   │   │       └── tableExport.ts
│   │   ├── leave-management
│   │   │   ├── api
│   │   │   │   └── leave.api.ts
│   │   │   └── components
│   │   │       └── LeaveManagementPage.tsx
│   │   ├── meetings
│   │   │   ├── api
│   │   │   │   └── meetings.api.ts
│   │   │   └── components
│   │   │       ├── MeetingRequestsPage.tsx
│   │   │       ├── MeetingsCalendarPage.tsx
│   │   │       └── MeetingsPage.tsx
│   │   ├── notifications
│   │   │   ├── api
│   │   │   │   └── notifications.api.ts
│   │   │   ├── components
│   │   │   │   └── NotificationsPage.tsx
│   │   │   └── hooks
│   │   │       ├── useNotifications.ts
│   │   │       └── useUnreadCount.ts
│   │   ├── performance
│   │   │   ├── api
│   │   │   │   └── performance.api.ts
│   │   │   └── components
│   │   │       └── PerformancePage.tsx
│   │   ├── personnel
│   │   │   ├── api
│   │   │   │   └── personnel.api.ts
│   │   │   ├── components
│   │   │   │   ├── PersonnelFilters.tsx
│   │   │   │   ├── PersonnelFormModal.tsx
│   │   │   │   ├── PersonnelPage.tsx
│   │   │   │   └── PersonnelTable.tsx
│   │   │   └── hooks
│   │   │       ├── useExportPersonnel.ts
│   │   │       ├── usePersonnel.ts
│   │   │       └── usePersonnelMutations.ts
│   │   ├── production-processes
│   │   │   └── components
│   │   │       └── ProductionProcessesPage.tsx
│   │   ├── projects
│   │   │   ├── api
│   │   │   │   └── projects.api.ts
│   │   │   ├── components
│   │   │   │   ├── create
│   │   │   │   │   ├── DepartmentDetailsFields.tsx
│   │   │   │   │   ├── ProjectCreateModal.tsx
│   │   │   │   │   ├── ProjectCreateStepOne.tsx
│   │   │   │   │   └── ProjectCreateStepTwo.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectCreatePage.tsx
│   │   │   │   ├── ProjectDetailPage.tsx
│   │   │   │   ├── projectsPage.constants.ts
│   │   │   │   ├── ProjectsPage.tsx
│   │   │   │   ├── projectsPage.types.ts
│   │   │   │   ├── projectsPage.utils.ts
│   │   │   │   └── StatsCard.tsx
│   │   │   └── hooks
│   │   │       └── useProjectCreate.ts
│   │   ├── reports
│   │   │   └── api
│   │   │       └── reports.api.ts
│   │   ├── roles
│   │   │   ├── api
│   │   │   │   └── roles.api.ts
│   │   │   └── components
│   │   │       └── RolesPermissionsPage.tsx
│   │   ├── tasks
│   │   │   ├── api
│   │   │   │   └── tasks.api.ts
│   │   │   └── components
│   │   │       ├── TaskBoardColumn.tsx
│   │   │       ├── TaskCreateModal.tsx
│   │   │       ├── TaskDetailPage.tsx
│   │   │       ├── tasks.constants.ts
│   │   │       ├── tasks.utils.ts
│   │   │       └── TasksPage.tsx
│   │   ├── tickets
│   │   │   ├── api
│   │   │   │   └── tickets.api.ts
│   │   │   └── components
│   │   │       ├── PortalRequestsPage.tsx
│   │   │       └── SupportRequestsPage.tsx
│   │   ├── time-tracker
│   │   │   ├── api
│   │   │   │   └── timeTracker.api.ts
│   │   │   ├── components
│   │   │   │   ├── sections
│   │   │   │   │   ├── DashboardTab.tsx
│   │   │   │   │   ├── TeamTab.tsx
│   │   │   │   │   ├── TimerTab.tsx
│   │   │   │   │   └── TimeTrackerTabs.tsx
│   │   │   │   ├── DraggableActiveTimer.tsx
│   │   │   │   ├── ManualEntryModal.tsx
│   │   │   │   ├── SortIcon.tsx
│   │   │   │   ├── timeTracker.types.ts
│   │   │   │   └── TimeTrackerPage.tsx
│   │   │   ├── hooks
│   │   │   │   ├── useActiveTimer.ts
│   │   │   │   └── useTimerMutations.ts
│   │   │   └── utils
│   │   │       └── timeTracker.utils.ts
│   │   └── working-hours
│   │       └── components
│   │           └── WorkingHoursPage.tsx
│   ├── shared
│   │   ├── components
│   │   │   ├── header
│   │   │   │   ├── index.ts
│   │   │   │   ├── LogoutButton.tsx
│   │   │   │   ├── NotificationsDropdown.tsx
│   │   │   │   ├── PageTitle.tsx
│   │   │   │   ├── RoleBadge.tsx
│   │   │   │   ├── UserAvatar.tsx
│   │   │   │   └── UserMenuDropdown.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── constants
│   │   │   ├── departments.ts
│   │   │   ├── errorMessages.ts
│   │   │   ├── navConfig.ts
│   │   │   ├── navPermissions.ts
│   │   │   ├── permissions.ts
│   │   │   ├── roleDashboardMap.ts
│   │   │   ├── roleLabels.ts
│   │   │   └── roles.ts
│   │   ├── hooks
│   │   │   └── usePermission.ts
│   │   ├── lib
│   │   │   ├── axios.ts
│   │   │   ├── queryClient.ts
│   │   │   └── sweetAlert.ts
│   │   └── utils
│   │       ├── colorTheme.ts
│   │       ├── formatDate.ts
│   │       └── formatDuration.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── sonner.tsx
├── .env.development
├── .gitignore
├── all_errors.txt
├── eslint_final_utf8.json
├── eslint_final.json
├── eslint_out_final.txt
├── eslint_out_utf8.txt
├── eslint_out.txt
├── eslint_results.json
├── eslint_run.json
├── eslint_utf8.json
├── eslint.config.js
├── eslint.json
├── eslint2_utf8.json
├── eslint2.json
├── eslint3_utf8.json
├── eslint3.json
├── generate_tree.cjs
├── index.html
├── package-lock.json
├── package.json
├── parse_eslint.cjs
├── parse_eslint.js
├── README.md
├── tailwind.config.js
├── test-users.js
├── tsc_fresh.txt
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Klasörlerin İşlevleri ve Mimari Yaklaşım

**Trivexa Web** projesi, gelişmiş bir B2B / Kurumsal Yönetim Paneli uygulamasıdır. `trivexa-landing` projesinde olduğu gibi **Feature-Sliced Design (FSD)** mimarisinden ilham alarak kurgulanmıştır. Çok sayıda sayfaya ve iş mantığına sahip olduğu için `features` (özellikler) ile `shared` (ortak) katmanı birbirinden çok daha keskin bir şekilde ayrılmıştır.

### 📁 Kök Dizin (Root) Klasörleri ve Dosyaları
* **`public/`**: Vite tarafından derlenmeden doğrudan kök dizine gönderilen, statik imajlar (SVG, WebIcon).
* **Proje Yapılandırma Dosyaları**:
  * `package.json`: Projenin yeteneklerini belirleyen temel kütüphaneler (React, React Router, Zustand, React-Query, Tailwind v4 vb.) ve komut betikleri.
  * `vite.config.ts`, `tailwind.config.js`: Derleyici ve stil aracı ayarları.
  * Kalabalık `.json` ve `.txt` ESLint çıktıları: Projenin linting ve kod kalite iyileştirmelerinin log (rapor) dosyalarıdır.
  * `.env.development`: Geliştirme ortamı için ortam (environment) değişkenlerini barındırır.

---

### 📁 `src/` (Kaynak Kod) Klasörü

Paneli oluşturan asıl dosyaların bulunduğu kök dizindir:

#### 1. `app/` (Sistem Kabuğu ve Güvenlik)
* **`router/guards/`**: Uygulamanın güvenliğinin sağlandığı noktadır. Kullanıcı giriş yapmış mı (`PrivateRoute`) ve girdiği sayfaya yetkisi var mı (`RoleGuard`) gibi kontroller yapılarak yetkisiz erişimler engellenir.

#### 2. `assets/` (Proje İçi Statikler)
* Proje içinde, bileşen olarak konumlandırılan ya da modül olarak eklenen SVG formatındaki ikonları (`icons/` klasörü altında) ve logoları içerir. 

#### 3. `features/` (İzole İş Modülleri - Core Domain)
Projenin "kalbi" olan bu klasör, yönetim panelinin her bir sayfa veya işlev grubunu (domain) tek bir yer etrafında toplar. Her özelliğin (örn. İnsan Kaynakları, Finans vb.) kendi API katmanı (`api/`), kendi durum yönetimi (`store/` veya `hooks/`) ve kendi sayfaları/bileşenleri (`components/`) bulunur:
* **`auth/`**: Giriş, oturum açma, log out gibi sadece kimlik doğrulama süreçlerini yürüten izole paket.
* **`projects/`, `finance/`, `personnel/`, `tasks/` vb.**: Her biri Trivexa panelindeki devasa birer modüldür. "Finans" bölümünü değiştirdiğinizde sadece `finance/` modülünün içerisine dokunursunuz, diğer bölümler etkilenmez.

#### 4. `shared/` (Ortak Katman)
Uygulamanın farklı **feature**'ları (Örn: `finance` modülü ile `personnel` modülü) tarafından *ortak olarak* tüketilen "paylaşımlı" yapılar havuzudur:
* **`components/`**: Genel sayfa yapısını oluşturan `Sidebar`, `AppHeader`, `AppLayout`, `Modal` gibi genel arayüz bileşenleri. 
* **`constants/`**: Çok kritik olan yetkilendirme rolleri (`roles.ts`), menü yapılandırması (`navConfig.ts`), departman listeleri (`departments.ts`) gibi sistem geneli değişmeyen sabit bilgiler.
* **`lib/`**: Üçüncü taraf kütüphane ayarlamalarının yapıldığı izolasyon klasörü. **Axios** (API aracı), **React Query Client** (Önbellekleme) ve **SweetAlert** burada başlatılır (boot edilir).
* **`utils/`**: Uygulamanın farklı yerlerinde tekrar tekrar kullanılan "tarih formatlama" vb. işlevler.

#### 5. Ana Dosyalar (`src/` Kökü)
* **`App.tsx` & `main.tsx`**: Uygulamayı ayağa kaldıran, React-Query ve Router gibi sistem çekirdeklerini en dıştan saran başlangıç noktalarıdır.
* **`index.css` & `App.css`**: Tailwind'in ve global değişkenlerin içeri alındığı ortak stil dosyaları.
* **`sonner.tsx`**: Projede beliren (toast) bildirimlerin/uyarı mesajlarının global bileşenini sarmalar.
