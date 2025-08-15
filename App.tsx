import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";

const OTP_LENGTH = 6;
type Sel = { start: number; end: number };

export default function App() {
  const inputRef = useRef<TextInput | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [selection, setSelection] = useState<Sel>({ start: 0, end: 0 });
  const [loading, setLoading] = useState(false);

  const value = useMemo(() => digits.join(""), [digits]);
  const isComplete = value.length === OTP_LENGTH && !digits.includes("");

  useEffect(() => {
    if (isComplete && !loading) handleSubmit();
  }, [isComplete, loading]);

  const focusInput = (pos?: number, selectOne?: boolean) => {
    inputRef.current?.focus();
    if (typeof pos === "number") {
      const clamped = Math.max(0, Math.min(OTP_LENGTH, pos));
      if (selectOne && digits[clamped]) {
        setSelection({ start: clamped, end: clamped + 1 });
      } else {
        setSelection({ start: clamped, end: clamped });
      }
    }
  };

  const sanitize = (raw: string) => raw.replace(/\D/g, "").slice(0, 1);

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    if (loading) return;
    const sel = e.nativeEvent.selection;
    const clamped: Sel = {
      start: Math.max(0, Math.min(OTP_LENGTH, sel.start)),
      end: Math.max(0, Math.min(OTP_LENGTH, sel.end)),
    };
    setSelection(clamped);
  };

  const handleChangeText = (nextText: string) => {
    if (loading) return;
    const clean = sanitize(nextText);
    if (clean && selection.start < OTP_LENGTH) {
      const updated = [...digits];
      updated[selection.start] = clean;
      setDigits(updated);
      const nextPos = Math.min(selection.start + 1, OTP_LENGTH - 1);
      setSelection({ start: nextPos, end: nextPos });
    }
  };

  const handleKeyPress = (e: any) => {
    if (loading) return;
    if (e.nativeEvent.key === "Backspace") {
      if (selection.start >= 0 && selection.start < OTP_LENGTH) {
        const updated = [...digits];
        updated[selection.start] = "";
        setDigits(updated);
      }
    }
  };

  const handleBoxPress = (index: number) => {
    if (loading) return;
    focusInput(index, true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      Keyboard.dismiss();
      await new Promise((res) => setTimeout(res, 1500));
      alert(`Submitted code: ${value}`);
      setDigits(Array(OTP_LENGTH).fill(""));
      setSelection({ start: 0, end: 0 });
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
        setSelection({ start: 0, end: 0 });
      }, 50);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter the 6-digit code</Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => focusInput(selection.start)}
          style={styles.row}
          testID="otp-row"
        >
          {digits.map((d, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => handleBoxPress(i)}
              style={[
                styles.box,
                d ? styles.boxFilled : undefined,
                loading ? styles.boxDisabled : undefined,
                selection.start === i && !loading ? styles.boxCaret : undefined,
              ]}
              testID={`otp-box-${i}`}
            >
              <Text style={styles.boxText} testID={`otp-char-${i}`}>
                {d || " "}
              </Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value=""
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
          onSelectionChange={handleSelectionChange}
          selection={selection}
          keyboardType={Platform.select({
            ios: "number-pad",
            android: "numeric",
          })}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={1}
          style={styles.hiddenInput}
          caretHidden
          editable={!loading}
          testID="otp-input"
        />

        <View style={styles.submitSlot}>
          {loading ? (
            <View style={styles.loadingRow} testID="loading">
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Verifying…</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, isComplete ? styles.hiddenBtn : null]}
              onPress={handleSubmit}
              disabled={isComplete || loading}
              testID="submit-btn"
            >
              <Text style={styles.submitLabel}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0f1a" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { color: "white", fontSize: 22, fontWeight: "600", marginBottom: 16 },
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#141a2a",
    borderWidth: 1,
    borderColor: "#2a3350",
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: { borderColor: "#5b6cff" },
  boxCaret: {
    borderColor: "#8aa1ff",
    shadowColor: "#8aa1ff",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  boxDisabled: { opacity: 0.6 },
  boxText: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  hiddenInput: { position: "absolute", opacity: 0, height: 0, width: 0 },
  submitLabel: { color: "white", fontWeight: "700" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: { color: "#cbd5e1" },
  submitSlot: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  hiddenBtn: { opacity: 0 },
  submitBtn: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#5b6cff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
