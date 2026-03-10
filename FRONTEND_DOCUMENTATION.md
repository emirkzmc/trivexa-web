# Trivexa Web - Frontend Documentation

## 1. Project Overview
- **Proje Adı:** Trivexa Web
- **Amaç:** Yönetim ve Müşteri Paneli (Admin & Customer Dashboard)
- **Kullanılan Framework:** React (v19)
- **Kullanılan Dil:** TypeScript
- **Build Tool:** Vite
- **Styling Sistemi:** Tailwind CSS (v4)
- **State Management:** Zustand (Client State), React Query (Server State)
- **API Yapısı:** Axios (Custom Interceptor ile yapılandırılmış)

## 2. Tech Stack
- **Core:** React, TypeScript, Vite
- **Routing:** React Router DOM
- **State Management:** Zustand, @tanstack/react-query
- **API & Network:** Axios, Socket.io-client
- **Form & Validation:** React Hook Form, Zod, @hookform/resolvers
- **Styling & UI:** Tailwind CSS, Lucide React (İkonlar)
- **Notifications & Modals:** Sonner, SweetAlert2, React Toastify
- **Utils & Charts:** Chart.js, React-Chartjs-2, docx, jspdf, xlsx

## 3. Project Structure
Projenin kök dizini altında bulunan `src` klasörü Feature-Sliced Design (FSD) prensiplerine uygun olarak organize edilmiştir:

```
src/
├── app/          # Uygulama genelindeki router, layout vb. çekirdek yapılandırmalar (guards vb.)
├── features/     # Her bir iş modülünün (domain) kendi bileşenleri, hook'ları ve API tanımları (auth, dashboard, projects, vb.)
└── shared/       # Tüm projede ortak kullanılan UI bileşenleri (Button, Modal vb.), utility fonksiyonları, API ayarları (axios.ts) ve sabitler
```

## 4. Architecture
Projede **Feature-Sliced Design (FSD)** benzeri (Domain-driven) modüler bir mimari kullanılmıştır. Mantıksal her bir yapı veya sayfa kendi `features` klasörü altında barındırılır. 
Örneğin; `auth` modülü kendi `api`, `components`, `hooks` ve `store` alt dizinlerine sahiptir. Bu sayede modüller arası bağımlılık en aza indirilmiştir.

## 5. Routing Structure
Routing işlemleri `react-router-dom` kullanılarak `App.tsx` içerisinde merkezi olarak yönetilmektedir:
- **Genel Yapı:** Kök `/` rotası otomatik olarak `/login` rotasına yönlendirilmektedir.
- **Korumalı Alanlar (Layouts):** 
  - Yönetim Paneli: `AppLayout` ile sarmalanmış tüm `/app/*` rotaları (Örn: `/app/dashboard`, `/app/projeler`).
  - Müşteri Paneli: `CustomerPanelLayout` ile sarmalanmış tüm `/customer-panel/*` rotaları.
- **Fallback:** Tanımlı olmayan rotalar (`*`) 404 mantığıyla giriş sayfasına veya ilgili panelin ana sayfasına (dashboard) yönlendirilir.

## 6. State Management
- **Global / Client State:** `Zustand` kullanılmıştır (Örn: `useAuthStore`). Kimlik doğrulama, kullanıcı bilgileri ve arayüz durumları Zustand ile tutulmaktadır.
- **Server / API State:** `@tanstack/react-query` kullanılmaktadır. API'den gelen verilerin önbelleğe alınması (caching), fetch edilmesi ve yönetimi bu kütüphane üzerinden sağlanır.

## 7. API Layer
API katmanı `axios` üzerine inşa edilmiştir. `src/shared/lib/axios.ts` içerisinde merkezi bir interceptor mantığı bulunmaktadır:
- **Request Interceptor:** `Zustand` statinden güncel `token` alınır ve istek başlıklarına `Authorization: Bearer <token>` olarak eklenir.
- **Response Interceptor:** 
  - `401 Unauthorized`: Token süresi dolmuşsa otomatik olarak `/auth/refresh` tetiklenir istek kuyruğa alınır (pendingQueue), token yenilendikten sonra önceki istek tekrar gönderilir.
  - `403 Forbidden`: Yetkisiz erişim hataları yakalanıp uyarı verilir.
  - `429 Too Many Requests`: `Retry-After` süresi backend'den okunarak istek bekletilir ve ardından tekrar atılır (Rate limit handling).
  - Sunucu hataları `sonner` ile global bir `toast` olarak kullanıcıya gösterilir.

## 8. Component Structure
Componentler modüler ve tekrar kullanılabilir bir yapıda yazılmıştır.
- **Shared Components:** `src/shared/components` içerisinde genel UI elemanları (Modal, Pagination, Sidebar, AppLayout) bulunur.
- **Feature Components:** `src/features/[feature]/components` altında domaine özel parçalar (Örn: AuthCard, LoginForm) yer alır.
- **Compound/Dumb Components:** Forma veya state'e bağımlı olmayan UI yapı bileşenleri (Input, Button) genellikle kendi `ui` klasörlerinde ayrıştırılır.

## 9. Styling System
Projede styling için **Tailwind CSS v4** kullanılmaktadır. 
- Tamamen utility-first (yardımcı sınıflar) yaklaşımı benimsenmiştir.
- Global stiller `index.css`'te, bileşene özel yapılandırmalar `className` dizilimleriyle verilmektedir. İkonlar için `lucide-react` entegredir.

## 10. Environment Variables
Projede Vite uyumlu `.env.development` kurgusu mevcuttur. Tanımlı değişkenler:
- `VITE_API_BASE_URL`: Backend API adresini tutar (Örn: `http://localhost:3500/api/v1`).
- `VITE_ENABLE_MOCK`: Component geliştirme veya test amaçlı mock API kullanımını kontrol eder.

## 11. Form Management
Veri girişi içeren tüm standart ve kompleks formlarda **React Hook Form** kullanılarak kontrol sağlanmaktadır (Örn: `useForm` hook'u ile).

## 12. Validation
Form geçerlilik (validation) kuralları yapısal olarak **Zod** schema validasyonu kullanılarak yönetilir.
- `z.object()` ile her veri öğesi için güçlü tiplenmiş kurallar ve hata mesajları (`message`) tanımlanır.
- React Hook Form için `@hookform/resolvers/zod` `resolver` nesnesiyle entegrasyon yapılmıştır.

## 13. Error Handling
- **API / Network Hataları:** Axios interceptor üzerinden global hata fırlatıcı tasarlanmıştır. `resolveErrorMessage` fonksiyonu ile backend'den gelen spesifik mesajlar ayrıştırılır ve `sonner` ile global bildirim olarak gösterilir.
- **Client Form Hataları:** Zod doğrulama kurallarıyla form düzeyinde validasyon uyarıları giriş alanlarının hemen altında sunulur.

## 14. Folder Rules
- **features/**: Bir modül diğer modülün iç aksanlarına bağımlı olmamalıdır. (Örn: auth klasöründe tasarımsal süreçlerle ilgili yapılar bulunmaz.)
- **shared/**: Proje genelinde ve birden fazla özellik tarafından paylaşılan ortak modülleri (lib, utils, components) içerir.
- **store/**: Zustand state yönetim dosyaları kendi özellik modülünün veya paylaşılan modülün içindedir.

## 15. Performance Patterns
- **Query Caching:** `@tanstack/react-query` ile uzak (remote) veriler önbelleğe alınmakta, asenkron verimli yükleme ve önbellekten geri yükleme sayesinde fazla API isteklerinin önüne geçilmektedir.

## 16. Coding Conventions
- **Component İsimlendirme:** React component dosyaları PascalCase (Örn: `LoginForm.tsx`) formatındadır. 
- **Diğer Bileşenler:** Hook'lar `useLogin.ts` örneğindeki gibi, diğer utility ve store dosyaları `camelCase` standartındadır.

## 17. How to Run Project
Kullanılan paket yöneticisi `npm`'dir. Uygulamayı ayağa kaldırmak için konsolda kök klasörde sırasıyla kullanılabilecek komutlar:

- Uygulamayı geliştirme modunda çalıştırmak için:
  ```bash
  npm run dev
  ```
- Projenin TypeScript doğrulamasını test edip production'a derlemek için:
  ```bash
  npm run build
  ```
- Linter çalıştırıp kod standartlarını denetlemek için:
  ```bash
  npm run lint
  ```


