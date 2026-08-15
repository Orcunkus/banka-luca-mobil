// Backend'deki (banka-luca-aktarim/backend) CanonicalTransaction / ParseResult
// şemalarıyla birebir eşleşir -- bkz. backend/app/schemas.py

export type Islem = {
  tarih: string; // "YYYY-MM-DD"
  evrak_no: string;
  aciklama: string;
  tutar: string; // Decimal, string olarak taşınıyor (JSON'da hassasiyet kaybı olmasın diye)
  bakiye: string | null;
  kaynak_banka?: string | null;
  ayristirma_yontemi?: string | null;
  guven_skoru?: number | null;
};

export type ParseSonucu = {
  banka: string;
  dosya_adi: string;
  ayristirma_yontemi: "kural" | "ai";
  islemler: Islem[];
  uyarilar: string[];
};

export type Banka = {
  key: string;
  ad: string;
};
