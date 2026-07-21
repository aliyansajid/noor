import { StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { EmblemStage } from "@/features/onboarding/components/emblem-stage";

/** Placeholder landing shown after onboarding. Chat / Today tabs land here next. */
export default function Home() {
  return (
    <Screen>
      <View style={styles.center}>
        <EmblemStage motif="star" size={104} />
        <ThemedText type="title" themeColor="primary" style={styles.title}>
          You’re all set
        </ThemedText>
        <ThemedText
          type="body"
          themeColor="textSecondary"
          style={styles.subtitle}
        >
          Your journey is ready. The chat and daily verse experience come next.
        </ThemedText>
      </View>
      <Button title="Ask the Qur’an" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", maxWidth: 300 },
});
