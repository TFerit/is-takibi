# Mesai Takip — GitHub Pages için PWA

Takvim üzerinden başlangıç/bitiş saati girerek çalışma süresi ve maaş takibi yapan, Türkçe ve çevrimdışı çalışabilen bir web uygulaması. Kayıtlar tarayıcının yerel depolamasında tutulur; hiçbir bilgi bir sunucuya gönderilmez.

## GitHub’a yükleme ve yayınlama

1. GitHub’da boş bir depo oluşturun (örneğin `mesai-takip`).
2. Bu klasördeki **tüm dosya ve klasörleri** deponun ana dizinine yükleyin. `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll` ve `icons/` klasörü birlikte yüklenmelidir.
3. Depoda **Settings → Pages** bölümünü açın.
4. **Build and deployment** altında `Deploy from a branch` seçin; dal olarak `main`, klasör olarak `/(root)` seçip kaydedin.
5. GitHub’ın verdiği bağlantıyı açın. Telefon tarayıcısındaki “Ana ekrana ekle / Uygulamayı yükle” seçeneğiyle uygulama gibi kurulabilir.

Uygulama bağlantısı depo adı altında olsa bile çalışır; tüm dosya yolları GitHub Pages alt klasörlerine göre göreli tanımlanmıştır.

## Kullanım

- Takvimden bir güne dokunun; başlangıç ve bitiş saati girin. Bitiş saati başlangıçtan erkense vardiya ertesi güne taşmış kabul edilir.
- “30 dk. öğle molası” seçilirse günlük net süreden yarım saat düşülür.
- Saatlik ücreti **Ayarlar** ekranından girin. Üst özet panelinde ücret gösterilmez.
- Aylık hedefi takvim ekranındaki “Düzenle” düğmesinden ekleyin. Hedefe ulaşmak için kalan günlerdeki gereken ortalama çalışma süresi hesaplanır.
