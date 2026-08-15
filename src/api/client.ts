import * as FileSystem from "expo-file-system";
import { Banka, Islem, ParseSonucu } from "../types";

// Render'a deploy ettiğimiz backend'in gerçek adresi. İleride başka bir
// adrese taşınırsa sadece burayı değiştirmek yeterli.
export const BASE_URL = "https://banka-luca-aktarim-backend.onrender.com";

export async function bankalariGetir(): Promise<Banka[]> {
  const resp = await fetch(`${BASE_URL}/api/bankalar`);
  if (!resp.ok) {
    throw new Error(`Banka listesi alınamadı (${resp.status})`);
  }
  return resp.json();
}

export async function dosyaAyristir(
  banka: string,
  dosyaUri: string,
  dosyaAdi: string,
  mimeType: string | null | undefined
): Promise<ParseSonucu> {
  const formData = new FormData();
  // React Native'de FormData'ya dosya eklemenin standart yolu budur --
  // web'deki File nesnesi yerine {uri, name, type} şeklinde bir nesne verilir.
  formData.append("dosya", {
    uri: dosyaUri,
    name: dosyaAdi,
    type: mimeType || "application/octet-stream",
  } as unknown as Blob);

  const resp = await fetch(
    `${BASE_URL}/api/parse?banka=${encodeURIComponent(banka)}`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        // Content-Type'ı BİLEREK set etmiyoruz -- fetch, FormData
        // gönderirken multipart sınırını (boundary) kendisi ekliyor.
      },
    }
  );

  if (!resp.ok) {
    const hataMetni = await resp.text().catch(() => "");
    throw new Error(`Ayrıştırma başarısız (${resp.status}): ${hataMetni}`);
  }

  return resp.json();
}

/** Backend'den Luca formatlı CSV alır ve cihazda geçici bir dosyaya yazar,
 * dosyanın yerel (file://) adresini döndürür. */
export async function csvOlusturVeKaydet(
  banka: string,
  islemler: Islem[],
  kronolojikArtan: boolean
): Promise<string> {
  const resp = await fetch(`${BASE_URL}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      banka,
      islemler,
      kronolojik_artan: kronolojikArtan,
    }),
  });

  if (!resp.ok) {
    const hataMetni = await resp.text().catch(() => "");
    throw new Error(`CSV üretilemedi (${resp.status}): ${hataMetni}`);
  }

  const blob = await resp.blob();
  const base64 = await blobToBase64(blob);
  const dosyaAdi = `${banka}_luca_aktarim.csv`;
  const hedefUri = `${FileSystem.cacheDirectory}${dosyaAdi}`;

  await FileSystem.writeAsStringAsync(hedefUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return hedefUri;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.onload = () => {
      const sonuc = reader.result as string; // "data:<mime>;base64,XXXX"
      const virgulIndex = sonuc.indexOf(",");
      resolve(sonuc.slice(virgulIndex + 1));
    };
    reader.readAsDataURL(blob);
  });
}
