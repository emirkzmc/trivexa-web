# Trivexa Web - Components Documentation

Bu doküman projede yer alan tüm temel, paylaşılan (shared) ve özellik bazlı (feature) UI bileşenlerini, üstlendikleri rolleri ve aldıkları temel özellikleri (props) listeler. Proje **Feature-Sliced Design (FSD)** mimarisini benimsediği için bileşenler kullanım amacına göre modüllere ayrılmıştır.

---

## 1. Shared / Core UI Components
Uygulama genelinde tekrar tekrar kullanılan, iş mantığı barındırmayan veya global state'e (örneğin Auth) temel seviyede bağlı olan bileşenlerdir.

### `Button` (`src/features/auth/components/ui/Button.tsx`)
Temel buton bileşenidir. Standart HTML buton özelliklerine (`ButtonHTMLAttributes`) ek olarak aşağıdaki propları alır:
- `children` (ReactNode): Buton metni veya içeriği.
- `fullWidth` (boolean) *(opsiyonel)*: `true` ise bulunduğu kabın tamamını kaplar (`w-full`). Varsayılan: `true`.
- `variant` ('primary' | 'secondary' | 'outline' | 'ghost' | 'danger') *(opsiyonel)*: Butonun stil varyantı. Varsayılan: `primary`.

### `Input` (`src/features/auth/components/ui/Input.tsx`)
Temel metin giriş bileşenidir. Standart `InputHTMLAttributes<HTMLInputElement>` özelliklerini miras alır.
- `className` (string) *(opsiyonel)*: Ekstra Tailwind CSS sınıfları eklemek için kullanılır.

### `Modal` (`src/shared/components/Modal.tsx`)
Ekranın üzerinde açılan pop-up (modal) pencereleri için standart container bileşenidir.
- `title` (string): Modal başlığı.
- `onClose` (function): Modal kapatılmak istendiğinde (X ikonuna tıklanınca) tetiklenen callback.
- `children` (ReactNode): Modal içerik alanı.
- `width` (number) *(opsiyonel)*: Modalın maksimum piksel genişliği. Varsayılan: `480`.

### `Pagination` (`src/shared/components/Pagination.tsx`)
Tablo ve listelerde veri sayfalamasını kontrol eden bileşendir.
- `currentPage` (number): O anki aktif sayfa.
- `totalPages` (number): Toplam sayfa sayısı.
- `total` (number): Toplam kayıt sayısı.
- `limit` (number): Sayfa başına görüntülenen kayıt sayısı.
- `onPageChange` (function): Sayfa değiştiğinde tetiklenir (`(page: number) => void`).
- `onLimitChange` (function): Listeleme limiti değiştiğinde tetiklenir (`(limit: number) => void`).
- `limitOptions` (number[]) *(opsiyonel)*: Kullanıcının seçebileceği limit opsiyonları. Varsayılan: `[20, 50]`.

### `StatusBadge` (`src/shared/components/StatusBadge.tsx`)
Kayıtların aktif/pasif durumlarını renkli etiketler halinde gösteren göstergedir.
- `active` (boolean): Durumun aktif olup olmaması.
- `activeLabel` (string) *(opsiyonel)*: Aktif etiket metni. Varsayılan: `'Aktif'`.
- `inactiveLabel` (string) *(opsiyonel)*: Pasif etiket metni. Varsayılan: `'Pasif'`.

---

## 2. Shared / Layout Components
Sayfa yapısını (, sidebar, header vs.) oluşturan kapsayıcı bileşenlerdir.

### `AppLayout` (`src/shared/components/AppLayout.tsx`)
Yönetim panelinin ana sarmalayıcı layoutudur (`/app/*` rotaları). Sidebar, Header ve içerik (`Outlet`) alanını koordine eder. Bildirim soketleri (`socket.io`), aktiflik durumu (Presence) ve global zamanlayıcı (`useActiveTimer`) burada başlatılıp dinlenir.

### `AppHeader` (`src/shared/components/AppHeader.tsx`)
Sayfanın üst navigasyon çubuğudur. Bildirimleri, kullanıcı profil menüsünü ve o anki sayfada bulunan aktif kullanıcıların (Presence) bilgisini barındırır.
- `pageName` (string): Başlık çubuğunda yazacak ilgili sayfa veya modül ismi.
- `user` (AppHeaderUser): Header'da gösterilecek oturum açmış kullanıcının kısa bilgileri (isim, rol, avatar vs.).
- `onLogout` (function): Çıkış butonuna basıldığında tetiklenir.
- `onMenuToggle` & `showMenuButton`: Mobil görünümde Sidebar'ı açıp kapatmaya yarayan özellikler.
- `activePresenceUsers` (PresenceUser[]): Soket üzerinden alınan sisteme aktif bağlı kişilerin listesi.

### `Sidebar` (`src/shared/components/Sidebar.tsx`)
Kullanıcının departmanı (`user.department`) ve rolüne (`user.role`, örn: SEO, MUHASEBE vb.) uygun yetkilere sahip olduğu navigasyon menü linklerini render eder.
- `isMobile`, `mobileOpen`, `onMobileClose`: Mobil cihaz ekran boyutlarına özel çekmece menü özellikleri.

### `NotificationsDropdown` (`src/shared/components/header/NotificationsDropdown.tsx`)
AppHeader içerisindeki çan ikonu üzerinden açılır (Dropdown) listeyi yönetir. Zili tıkladığında `@tanstack/react-query` kullanarak `/notifications/api/` rotasından son bildirimleri getirir ve okundu işaretleme operasyonlarını gerçekleştirir.

---

## 3. Feature-Specific Components (Örnekleme)
Domain bazlı iş süreçlerini barındıran kompleks bileşenlerdir.

### `AuthCard` & `AuthLayout` (`src/features/auth/components/ui/`)
Giriş formunu ortalayarak gösteren kapsayıcı UI parçalarıdır. Özel bir iş mantığından ziyade tasarımı standartlaştırmak için oluşturulmuştur.
- `AuthCardProps`: Sadece `children` ve opsiyonel `className` argümanı kabul eder.

### `LoginForm` (`src/features/auth/components/LoginForm.tsx`)
Kimlik doğrulama ekranı bileşenidir.
- **State/Form Yönetimi:** `react-hook-form` ve `zod` (`loginSchema`) kullanarak e-posta ve şifre inputlarını yönetir, doğrulamasını sağlar.
- **Kullandığı Hook:** `useLogin.ts` mutasyonunu kullanarak backend isteklerini gönderir.
- **İlk Giriş Modal'ı (FirstLogin):** Sisteme ilk defa giren personeller için zorunlu şifre değiştirme modalını (`showFirstLoginModal`) tetikler.
- **Prop Almaz**, direkt iç Zustand state'inden bağlama yaparak çalışır.

### `FirstLoginForm` / `FirstLoginPage`
İlk giriş (şifre sıfırlama vb.) veya parola yönetimi operasyonları için Auth formu uzantılarıdır. Standart Input ve Button bileşenleriyle entegredir.

---

*(Bileşenlerin tamamı FSD yapısına uygun olarak `src/features/[feature_name]/components/` veya `src/shared/components/` altında konumlandırılmaktadır. Yeni bir bileşen geliştirirken doğrudan ortak Shared nesnelere (Button, Input, vb.) başvurulması standart kabul edilmiştir.)*

---

## 4. Trivexa Landing - Shared / Core UI Components
Müşteri portalı ve kurumsal sayfalar (`trivexa-landing`) için ortak kullanılan, sadeleştirilmiş bileşenlerdir.

### `Button` (`src/shared/ui/Button.tsx`)
Temel buton bileşenidir. Yönetim paneli projelerinden farklı olarak sınırlı varyasyon sunar.
- `variant` ('default' | 'login') *(opsiyonel)*: Butonun stil varyantı.
- `text` veya `children` (ReactNode): Buton içeriği.

### `Input` (`src/shared/ui/Input.tsx`)
Basitleştirilmiş metin giriş bileşenidir.
- `variant` ('default' | 'login') *(opsiyonel)*: Login varyantında gri çerçeveli daha belirgin bir zemin kullanılır.

### `FormField` (`src/shared/ui/FormField.tsx`)
Label ve yardımcı elementleri saran dikey bir kapsayıcıdır.
- `label` (string): Giriş alanının başlığı.
- `htmlFor` (string) *(opsiyonel)*: Erişilebilirlik için içerideki input'un ID değeri.
- `children` (ReactNode): Genellikle `Input` bileşenini içine alır.

---

## 5. Trivexa Landing - Shared / Layout Components
Açılış sayfaları ve Müşteri Paneli yapısını kuran bileşenlerdir.

### `Navbar` (`src/shared/layout/Navbar.tsx`)
Tüm genel sayfalarda (Ana sayfa, İletişim, Takım) görünen üst menüdür.
- `currentPath` (string): Aktif menüyü çizgi ile vurgular.
- `isScrolled` (boolean): Sayfa aşağı kaydırıldığında arka planı solid siyaha çevirir (backdrop-blur tabanlı).
- `onNavigate` (function): Navigasyon linki tıklandığında History API hook'unu tetikler.

### `CustomerPanelSidebar` (`src/features/customer-panel/components/CustomerPanelSidebar.tsx`)
Müşteri paneli (`/customer-panel/*`) için sol menü yönetimi.
- `currentPath` (string): İlgili sayfayı vurgular (ör: Sozlesmeler, Projeler).
- `isMobile`, `mobileOpen`, `collapsed`: Menünün dar, açık (hamburger) veya kapalı olmasını belirleyen responsive proplar.
- `unreadTickets` / `pendingInvoices`: İlgili menülerin sağ tarafında bildirim (badge) sayılarını görüntüler.

### `CustomerPanelHeader` (`src/features/customer-panel/components/CustomerPanelHeader.tsx`)
Müşteri paneli üst kısmı. Mobilde hamburger menü erişimi ve kullanıcı profil bilgilerini barındırır.
- `pageName` (string): Bulunulan sayfanın başlığı.
- `userName` / `userEmail` / `roleLabel`: Giriş yapmış kullanıcının detayları.

### `CustomerPanelContent` (`src/features/customer-panel/components/CustomerPanelContent.tsx`)
`CustomerPanelPage` içerisindeki merkezi yönlendirme (İçerik render) bileşenidir. 
- `currentPath` prop değerine göre ilgili alt bileşenleri (Projeler, Sözleşmeler, Destek Talepleri bileşenleri) ekrana çizer ve gerekli state objelerini (`dashboardData`, `tickets`, `projects` vb.) dağıtır.
