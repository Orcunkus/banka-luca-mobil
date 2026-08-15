# Banka Ekstresi → Luca — Mobil Uygulama (v0.1)

React Native + Expo ile yazıldı. Backend (ayrıştırma + Luca CSV motoru)
zaten `https://banka-luca-aktarim-backend.onrender.com` adresinde canlı
(bkz. `banka-luca-aktarim` reposu) -- bu uygulama sadece o servisi
telefonun dosya seçici / paylaşım menüsü ile birleştiren istemci.

## Ekranlar

- `src/screens/AnaEkran.tsx`: banka seçimi, dosya seçme (PDF/Excel),
  backend'e yükleme.
- `src/screens/OnizlemeEkran.tsx`: ayrıştırılan işlemleri liste hâlinde
  gösterir, dokunup düzenleme, sağa kaydırıp silme, toplam borç/alacak
  özeti, "CSV Oluştur ve Paylaş" ile native paylaşım menüsünü açar.
- `src/api/client.ts`: backend ile konuşan tüm ağ isteklerini içerir.

## Bu ortamda TEST EDİLEMEDİ

Bu kod, üzerinde çalıştığım bulut ortamının npm paket sunucusuna
erişimi olmadığı için `npm install` ile hiç denenemedi -- backend'in
aksine burada gerçek bir "çalıştı" doğrulaması yapamadım. Kod, Expo'nun
bilinen/stabil API kalıplarına göre dikkatlice yazıldı, ama ilk canlı
denemede küçük hatalar çıkması olası (backend'de olduğu gibi -- orada da
birlikte 2-3 turda düzelttik).

## Nasıl test edilir (bilgisayara kurulum YAPMADAN)

En hızlı yol: **Expo Snack** ile önizleme.
1. `snack.expo.dev` adresine git.
2. Sağ üstteki "..." menüsünden "Import git repository" seç.
3. Bu projenin GitHub adresini yapıştır.
4. "Run on your device" ile telefonuna (Expo Go uygulamasını kurduktan
   sonra) QR kod okutup anında dene.

Gerçek, telefona kurulabilir bir `.apk` için: **EAS Build** (Expo'nun
bulut derleme servisi, yine tarayıcıdan, terminal gerekmez):
1. expo.dev'de ücretsiz hesap aç, GitHub ile bağlan.
2. Yeni proje oluştur, proje ayarlarından bu GitHub reposunu bağla
   ("Build from GitHub" özelliği).
3. Platform olarak "android", profil olarak "preview" seç, build başlat.
4. Bitince inen `.apk` dosyasını Android telefona doğrudan kurabilirsin.
5. iOS için Apple Developer hesabı ($99/yıl) gerekiyor, "production"
   profiliyle build alıp TestFlight'a yükleriz.

## Backend adresini değiştirmek

`src/api/client.ts` dosyasındaki `BASE_URL` sabitini güncelleyin.
