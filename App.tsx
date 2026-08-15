import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnaEkran from "./src/screens/AnaEkran";
import OnizlemeEkran from "./src/screens/OnizlemeEkran";
import { ParseSonucu } from "./src/types";

export default function App() {
  const [sonuc, setSonuc] = useState<ParseSonucu | null>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {sonuc ? (
          <OnizlemeEkran sonuc={sonuc} onGeri={() => setSonuc(null)} />
        ) : (
          <AnaEkran onSonuc={setSonuc} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
