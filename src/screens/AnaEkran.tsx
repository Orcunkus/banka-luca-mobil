import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { bankalariGetir, dosyaAyristir } from "../api/client";
import { Banka, ParseSonucu } from "../types";

type Props = {
  onSonuc: (sonuc: ParseSonucu) => void;
};

export default function AnaEkran({ onSonuc }: Props) {
  const [bankalar, setBankalar] = useState<Banka[]>([]);
  const [secilenBanka, setSecilenBanka] = useState<string | null>(null);
  const [seciliDosyaAdi, setSeciliDosyaAdi] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [bankalarYukleniyor, setBankalarYukleniyor] = useState(true);

  useEffect(() => {
    bankalariGetir()
      .then((liste) => {
        setBankalar(liste);
        if (liste.length > 0) setSecilenBanka(liste[0].key);
      })
      .catch((e) => {
        Alert.alert(
          "Sunucuya ulaşılamadı",
          "Banka listesi alınamadı. İnternet bağlantınızı kontrol edin.\n\n" +
            String(e?.message ?? e)
        );
      })
      .finally(() => setBankalarYukleniyor(false));
  }, []);

  async function dosyaSecVeYukle() {
    if (!secilenBanka) {
      Alert.alert("Banka seçin", "Önce ekstrenin hangi bankaya ait olduğunu seçmelisiniz.");
      return;
    }

    const sonuc = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (sonuc.canceled || !sonuc.assets || sonuc.assets.length === 0) {
      return;
    }

    const dosya = sonuc.assets[0];
    setSeciliDosyaAdi(dosya.name);
    setYukleniyor(true);

    try {
      const parseSonucu = await dosyaAyristir(
        secilenBanka,
        dosya.uri,
        dosya.name,
        dosya.mimeType
      );
      onSonuc(parseSonucu);
    } catch (e: any) {
      Alert.alert(
        "Ayrıştırma başarısız",
        "Ekstre işlenirken bir hata oluştu:\n\n" + String(e?.message ?? e)
      );
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.baslik}>Banka Ekstresi → Luca</Text>
      <Text style={styles.aciklama}>
        Ekstrenizi (PDF veya Excel) seçin, otomatik olarak Luca'ya uygun hâle getirelim.
      </Text>

      <Text style={styles.etiket}>Banka</Text>
      {bankalarYukleniyor ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.bankaListesi}>
          {bankalar.map((b) => (
            <Pressable
              key={b.key}
              onPress={() => setSecilenBanka(b.key)}
              style={[
                styles.bankaSecenegi,
                secilenBanka === b.key && styles.bankaSecenegiAktif,
              ]}
            >
              <Text
                style={[
                  styles.bankaSecenegiYazi,
                  secilenBanka === b.key && styles.bankaSecenegiYaziAktif,
                ]}
              >
                {b.ad}
              </Text>
            </Pressable>
          ))}
          {bankalar.length === 0 && (
            <Text style={styles.uyari}>Sunucudan banka listesi alınamadı.</Text>
          )}
        </View>
      )}

      <Pressable
        style={[styles.buyukButon, yukleniyor && styles.buyukButonPasif]}
        onPress={dosyaSecVeYukle}
        disabled={yukleniyor}
      >
        {yukleniyor ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buyukButonYazi}>📄 Ekstre Yükle</Text>
        )}
      </Pressable>

      {seciliDosyaAdi && (
        <Text style={styles.seciliDosya}>Seçilen dosya: {seciliDosyaAdi}</Text>
      )}

      {yukleniyor && (
        <Text style={styles.yukleniyorMetni}>
          Ekstre okunuyor, karmaşık ya da taranmış bir dosyaysa yapay zeka ile
          analiz ediliyor olabilir -- bu biraz zaman alabilir…
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 72,
    backgroundColor: "#F5F7FB",
  },
  baslik: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  aciklama: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 28,
    lineHeight: 21,
  },
  etiket: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bankaListesi: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  bankaSecenegi: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  bankaSecenegiAktif: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  bankaSecenegiYazi: {
    color: "#374151",
    fontWeight: "500",
  },
  bankaSecenegiYaziAktif: {
    color: "#fff",
  },
  buyukButon: {
    backgroundColor: "#0B5FFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buyukButonPasif: {
    opacity: 0.7,
  },
  buyukButonYazi: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  seciliDosya: {
    marginTop: 16,
    textAlign: "center",
    color: "#4B5563",
  },
  yukleniyorMetni: {
    marginTop: 12,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  uyari: {
    color: "#B91C1C",
  },
});
