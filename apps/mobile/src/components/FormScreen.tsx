import { createContext, type ReactNode, useCallback, useContext, useRef } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from "react-native";
import type { ScrollView as ScrollViewType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/components/ui";

type FormScreenContextValue = {
  dismissKeyboard: () => void;
  scrollToEndOnFocus: () => void;
};

const FormScreenContext = createContext<FormScreenContextValue>({
  dismissKeyboard: () => undefined,
  scrollToEndOnFocus: () => undefined
});

export function FormScreen({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollViewType>(null);

  const scrollToEndOnFocus = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 250);
  }, []);

  const contextValue = {
    dismissKeyboard: Keyboard.dismiss,
    scrollToEndOnFocus
  };

  return (
    <FormScreenContext.Provider value={contextValue}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormScreenContext.Provider>
  );
}

export function useFormScreen() {
  return useContext(FormScreenContext);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardAvoiding: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: 16,
    padding: 20,
    paddingBottom: 220
  }
});
