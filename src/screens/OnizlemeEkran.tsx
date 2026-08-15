import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import * as Sharing from "expo-sharing";
import { csvOlusturVeKaydet } from "../api/client";
import { Islem, ParseSonucu } from "../types";

type Props = {
  sonuc: ParseSonucu;
  onGeri: () => void;
};

function turkceParaFormatla(tutarStr: string): string {
  const sayi = Number(tutarStr);
  if (Number.isNaN(sayi)) return tutarStr;
  const isaret = sayi < 0 ? "-" : "";
  const mutlak = Math.abs(sayi).toFixed(2);
  const [tamKisim, ondalik] = mutlak.split(".");
  const gruplu = tamKisim.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isaret}${gruplu},${ondalik} TL`;
}

export default function OnizlemeEkran({ sonuc, onGeri }: Props) {
  const [islemler, setIslemler] = useState<Islem[]>(sonuc.islemler);
  const [duzenlenenIndex, setDuzenlenenIndex] = useState<number | null>(null);
  const [kronolojikArtan, setKronolojikArtan] = useState(false);
  const [paylasiliyor, setPaylasiliyor] = useState(false);

  const { toplamBorc, toplamAlacak } = useMemo(() => {
    let borc = 0;
    let alacak = 0;
    for (const i of islemler) {
      const t = Number(i.tutar);
      if (Number.isNaN(t)) continue;
      if (t < 0) borc += -t;
      else alacak += t;
    }
    return { toplamBorc: borc, toplamAlacak: alacak };
  }, [islemler]);

  function satirSil(index: number) {
    setIslemler((prev) => prev.filter((_, i) => i !== index));
  }

  function satirGuncelle(index: number, guncel: Islem) {
    setIslemler((prev) => prev.map((i, idx) => (idx === index ? guncel : i)));
    setDuzenlenenIndex(null);
  }

  async function csvUretVePaylas() {
    if (islemler.length === 0) {
      Alert.alert("Liste boş", "Paylaşacak işlem kalmadı.");
      return;
    }
    setPaylasiliyor(true);
    try {
      const dosyaUri = await csvOlusturVeKaydet(
        sonuc.banka,
        islemler,
        kronolojikArtan
      );
      const kullanilabilirMi = await Sharing.isAvailableAsync();
      if (!kullanilabilirMi) {
        Alert.alert(
          "Paylaşım kullanılamıyor",
          "Bu cihazda paylaşım menüsü açılamadı. Dosya şurada: " + dosyaUri
        );
        return;
      }
      await Sharing.shareAsync(dosyaUri, {
        mimeType: "text/csv",
        dialogTitle: "Luca CSV'sini paylaş",
        UTI: "public.comma-separated-values-text",
      });
    } catch (e: any) {
      Alert.alert("Hata", "CSV oluşturulamadı:\n\n" + String(e?.message ?? e));
    } finally {
      setPaylasiliyor(false);
    }
  }

  return (
    <View style={styles.kapsayici}>
      <View style={styles.ust}>
        <Pressable onPress={onGeri} hitSlop={12}>
          <Text style={styles.geriYazi}>‹ Geri</Text>
        </Pressable>
        <Text style={styles.ustBaslik}>{sonuc.dosya_adi}</Text>
        <View style={{ width: 44 }} />
      </View>

      {sonuc.uyarilar.length > 0 && (
        <View style={styles.uyariKutusu}>
          {sonuc.uyarilar.map((u, i) => (
            <Text key={i} style={styles.uyariMetni}>
              ⚠️ {u}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.ozetKutusu}>
        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>Toplam Borç</Text>
          <Text style={[styles.ozetDeger, { color: "#DC2626" }]}>
            {turkceParaFormatla(String(-toplamBorc))}
          </Text>
        </View>
        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>Toplam Alacak</Text>
          <Text style={[styles.ozetDeger, { color: "#059669" }]}>
            {turkceParaFormatla(String(toplamAlacak))}
          </Text>
        </View>
        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>İşlem Sayısı</Text>
          <Text style={styles.ozetDeger}>{islemler.length}</Text>
        </View>
      </View>

      <FlatList
        data={islemler}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item, index }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                style={styles.silButon}
                onPress={() => satirSil(index)}
              >
                <Text style={styles.silButonYazi}>Sil</Text>
              </Pressable>
            )}
          >
            <Pressable
              style={styles.satir}
              onPress={() => setDuzenlenenIndex(index)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.satirTarih}>{item.tarih}</Text>
                <Text style={styles.satirAciklama} numberOfLines={2}>
                  {item.aciklama}
                </Text>
              </View>
              <Text
                style={[
                  styles.satirTutar,
                  { color: Number(item.tutar) < 0 ? "#DC2626" : "#059669" },
                ]}
              >
                {turkceParaFormatla(item.tutar)}
              </Text>
            </Pressable>
          </Swipeable>
        )}
        ListEmptyComponent={
          <Text style={styles.bosListe}>Gösterilecek işlem yok.</Text>
        }
      />

      <View style={styles.altBar}>
        <View style={styles.siraToggle}>
          <Text style={styles.siraToggleYazi}>Eskiden yeniye sırala</Text>
          <Switch value={kronolojikArtan} onValueChange={setKronolojikArtan} />
        </View>
        <Pressable
          style={[styles.paylasButon, paylasiliyor && { opacity: 0.7 }]}
          onPress={csvUretVePaylas}
          disabled={paylasiliyor}
        >
          {paylasiliyor ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paylasButonYazi}>CSV Oluştur ve Paylaş</Text>
          )}
        </Pressable>
      </View>

      <DuzenlemeModal
        gorunur={duzenlenenIndex !== null}
        islem={duzenlenenIndex !== null ? islemler[duzenlenenIndex] : null}
        onIptal={() => setDuzenlenenIndex(null)}
        onKaydet={(guncel) => {
          if (duzenlenenIndex !== null) satirGuncelle(duzenlenenIndex, guncel);
        }}
      />
    </View>
  );
}

function DuzenlemeModal({
  gorunur,
  islem,
  onIptal,
  onKaydet,
}: {
  gorunur: boolean;
  islem: Islem | null;
  onIptal: () => void;
  onKaydet: (i: Islem) => void;
}) {
  const [taslak, setTaslak] = useState<Islem | null>(islem);

  React.useEffect(() => {
    setTaslak(islem);
  }, [islem]);

  if (!taslak) return null;

  return (
    <Modal visible={gorunur} animationType="slide" transparent>
      <View style={styles.modalArkaPlan}>
        <View style={styles.modalKutu}>
          <Text style={styles.modalBaslik}>İşlemi Düzenle</Text>

          <Text style={styles.modalEtiket}>Tarih (YYYY-AA-GG)</Text>
          <TextInput
            style={styles.modalGiris}
            value={taslak.tarih}
            onChangeText={(v) => setTaslak({ ...taslak, tarih: v })}
          />

          <Text style={styles.modalEtiket}>Evrak No</Text>
          <TextInput
            style={styles.modalGiris}
            value={taslak.evrak_no}
            onChangeText={(v) => setTaslak({ ...taslak, evrak_no: v })}
          />

          <Text style={styles.modalEtiket}>Açıklama</Text>
          <TextInput
            style={[styles.modalGiris, { height: 70 }]}
            value={taslak.aciklama}
            onChangeText={(v) => setTaslak({ ...taslak, aciklama: v })}
            multiline
          />

          <Text style={styles.modalEtiket}>Tutar (nokta ile, ör. -116072.31)</Text>
          <TextInput
            style={styles.modalGiris}
            value={taslak.tutar}
            onChangeText={(v) => setTaslak({ ...taslak, tutar: v })}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.modalEtiket}>Bakiye</Text>
          <TextInput
            style={styles.modalGiris}
            value={taslak.bakiye ?? ""}
            onChangeText={(v) => setTaslak({ ...taslak, bakiye: v })}
            keyboardType="numbers-and-punctuation"
          />

          <View style={styles.modalButonSatiri}>
            <Pressable style={styles.modalIptalButon} onPress={onIptal}>
              <Text style={styles.modalIptalYazi}>Vazgeç</Text>
            </Pressable>
            <Pressable
              style={styles.modalKaydetButon}
              onPress={() => onKaydet(taslak)}
            >
              <Text style={styles.modalKaydetYazi}>Kaydet</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: "#F5F7FB", paddingTop: 56 },
  ust: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  geriYazi: { color: "#0B5FFF", fontSize: 16, fontWeight: "600" },
  ustBaslik: { fontSize: 14, color: "#374151", fontWeight: "600", flexShrink: 1 },
  uyariKutusu: {
    backgroundColor: "#FEF3C7",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  uyariMetni: { color: "#92400E", fontSize: 12, lineHeight: 17 },
  ozetKutusu: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  ozetSatir: { alignItems: "center" },
  ozetEtiket: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  ozetDeger: { fontSize: 14, fontWeight: "700", color: "#111827" },
  satir: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
  },
  satirTarih: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  satirAciklama: { fontSize: 14, color: "#111827" },
  satirTutar: { fontSize: 14, fontWeight: "700", marginLeft: 8 },
  silButon: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    marginBottom: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  silButonYazi: { color: "#fff", fontWeight: "700" },
  bosListe: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  altBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  siraToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  siraToggleYazi: { color: "#374151", fontSize: 13 },
  paylasButon: {
    backgroundColor: "#0B5FFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  paylasButonYazi: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalArkaPlan: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalKutu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalBaslik: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalEtiket: { fontSize: 12, color: "#6B7280", marginBottom: 4, marginTop: 10 },
  modalGiris: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  modalButonSatiri: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  modalIptalButon: { paddingVertical: 12, paddingHorizontal: 16 },
  modalIptalYazi: { color: "#6B7280", fontWeight: "600" },
  modalKaydetButon: {
    backgroundColor: "#0B5FFF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalKaydetYazi: { color: "#fff", fontWeight: "700" },
});
