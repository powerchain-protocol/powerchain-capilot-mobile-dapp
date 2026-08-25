import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  listConversations,
} from "../../integrations/ai";
import type {
  ConversationSummary,
} from "../../types/messages";
import { usePowerChainTheme } from "../../theme";

export function ConversationRail({
  selectedId,
  onSelect,
  onNew,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const { theme } = usePowerChainTheme();
  const [items, setItems] =
    useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);

    try {
      const result = await listConversations();
      setItems(result.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Conversations
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textMuted },
            ]}
          >
            Recent Copilot threads
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New conversation"
          onPress={onNew}
          style={({ pressed }) => [
            styles.newButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={theme.colors.primaryForeground}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {loading ? (
          <Text
            style={[
              styles.empty,
              { color: theme.colors.textMuted },
            ]}
          >
            Loading conversations…
          </Text>
        ) : items.length ? (
          items.map((item) => {
            const selected = item.id === selectedId;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(item.id)}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: selected
                      ? theme.colors.surfaceSubtle
                      : "transparent",
                    borderColor: selected
                      ? theme.colors.borderStrong
                      : "transparent",
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.itemTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  {item.title || "New conversation"}
                </Text>

                {item.preview ? (
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.preview,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {item.preview}
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <Text
            style={[
              styles.empty,
              { color: theme.colors.textMuted },
            ]}
          >
            No previous conversations.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
  },
  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  newButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 4,
    padding: 8,
  },
  item: {
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  itemTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  preview: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
  },
  empty: {
    padding: 10,
    fontSize: 12,
    lineHeight: 17,
  },
});
