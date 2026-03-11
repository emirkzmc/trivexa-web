# Trivexa - Frontend Documentation

Bu dokümantasyon Trivexa'nın iki ana frontend projesini kapsamaktadır: **trivexa-web** (Admin Dashboard) ve **trivexa-landing** (Müşteri Portal ve Tanıtım Yüzü).

## 1. Project Overviews

### A. Trivexa Web (Admin Panel)
- **Amaç:** Yönetim ve Müşteri Paneli (Admin Dashboard)
- **Kullanılan Framework:** React (v19)
- **Kullanılan Dil:** TypeScript
- **Build Tool:** Vite
- **Styling Sistemi:** Tailwind CSS (v4)
- **State Management:** Zustand (Client State), React Query (Server State)
- **API Yapısı:** Axios (Custom Interceptor ile yapılandırılmış)

### B. Trivexa Landing (Müşteri Yüzü)
- **Amaç:** Kurumsal Tanıtım Sitesi ve Müşteri Portalı (Customer Portal)
- **Kullanılan Framework:** React (v19)
- **Kullanılan Dil:** TypeScript
- **Build Tool:** Vite
- **Styling Sistemi:** Tailwind CSS (v4)
- **State Management:** Yerel Component State (`useState`), Custom Hook'lar (Örn: `useAppRouter`, LocalStorage Session). Dış bir kütüphane (Redux/Zustand) kullanılmamıştır.
- **Routing:** Vanilla tarayıcı History API üzerine kurulu özel `useAppRouter` hook'u.

## 2. Tech Stack

- **Core:** React, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Lucide React (İkonlar)
- **Trivexa Web Özel Bağımlılıklar:** 
  - React Router DOM, Zustand, @tanstack/react-query
  - Axios, Socket.io-client
  - React Hook Form, Zod, @hookform/resolvers
  - Sonner, SweetAlert2, React Toastify, Chart.js, XLSX, vb.

## 3. Project Structure
Her iki projenin kök dizini altında bulunan `src` klasörleri **Feature-Sliced Design (FSD)** prensiplerine uygun olarak organize edilmiştir:

```
src/
├── app/          # Uygulama genelindeki router (`useAppRouter` veya `react-router`), layout vb. çekirdek yapılandırmalar (guards vb.)
├── features/     # Her bir iş modülünün (domain) kendi bileşenleri, hook'ları ve API tanımları (auth, dashboard, projects, contact, vb.)
└── shared/       # Tüm projede ortak kullanılan UI bileşenleri (Button, Modal vb.), utility fonksiyonları
```

## 4. Architecture
Her iki projede de **Feature-Sliced Design (FSD)** benzeri (Domain-driven) modüler bir mimari kullanılmıştır. Mantıksal her bir yapı veya sayfa kendi `features` klasörü altında barındırılır. Bu sayede modüller arası bağımlılık (coupling) en aza indirilmiştir.

## 5. Routing Structure
Projelere göre routing işlemleri farklılık gösterir:

- **Trivexa Web:** `react-router-dom` kullanılarak `App.tsx` içerisinde merkezi olarak yönetilmektedir. Korumalı alanlar kapsayıcı (layout) bileşenler üzerinden yönlendirilir.
- **Trivexa Landing:** Performans ve sadelik odaklı olarak projenin kendi history-api bazlı `useAppRouter.ts` custom hook'u geliştirilmiştir. Sayfa değişimleri `App.tsx` üzerinden render edilen component'ler aracılığıyla gerçekleştirilir (Örn: `currentPath === '/iletisim'`).

## 6. State Management
- **Trivexa Web:** `Zustand` (Global/Client State) ve `@tanstack/react-query` (API/Server State).
- **Trivexa Landing:** Harici kütüphane yoktur. Oturum bilgileri LocalStorage tabanlı oturum servisleri (`portalSession.ts`) ile yönetilmekte; arayüz durumsallığı bileşen özellikleri (props) ve context ile taşınmaktadır.

## 7. API Layer
- **Trivexa Web:** Merkezi bir Axios instance'ı kullanılmış, token refresh ve yetki kontrolleri (interceptor) yapılandırılmıştır.
- **Trivexa Landing:** Form gönderimleri genellikle fetch veya page-specific özel hook'lar üzerinden ele alınmakta (varsa mock datalarla desteklenmekte). İleri seviye bir global caching hook'u (React Query gibi) bu projede tercih edilmemiştir.

## 8. Component Structure
Componentler modüler ve tekrar kullanılabilir bir yapıda yazılmıştır. Her iki proje de şu desenleri takip eder:
- **Shared Components:** `src/shared/layout` ve `src/shared/ui` (veya `src/shared/components`) içerisinde genel UI elemanları (Navbar, Button) bulunur.
- **Feature Components:** `src/features/[feature]/components` altında domaine özel iş mantığı olan kapsayıcı parçalar yer alır.

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


