import { useState } from "react";
import { View } from "react-native";
import { MessageComposer } from "../src/components/chat";
import { PowerChainLogo } from "../src/components/brand";
import {
  PowerChainThemeProvider,
  ThemeSelector,
} from "../src/theme";

export default function ComposerExample() {
  const [value, setValue] = useState("");

  return (
    <PowerChainThemeProvider defaultTheme="light">
      <View style={{ padding: 16, gap: 16 }}>
        <PowerChainLogo size={40} />
        <ThemeSelector />

        <MessageComposer
          value={value}
          onChangeText={setValue}
          onSend={async (message) => {
            console.log(message);
            setValue("");
          }}
        />
      </View>
    </PowerChainThemeProvider>
  );
}
