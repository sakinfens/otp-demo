import React from "react";
import { render, fireEvent, act, screen } from "@testing-library/react-native";
import App from "../App";

jest.useFakeTimers();

const typeDigitAt = async (index: number, digit: string) => {
  const input = screen.getByTestId("otp-input");
  fireEvent(input, "selectionChange", {
    nativeEvent: { selection: { start: index, end: index } },
  });
  fireEvent.changeText(input, digit);
};

const backspaceAt = async (index: number) => {
  const input = screen.getByTestId("otp-input");
  fireEvent(input, "selectionChange", {
    nativeEvent: { selection: { start: index, end: index } },
  });
  fireEvent(input, "keyPress", { nativeEvent: { key: "Backspace" } });
};

const expectBoxToEqual = (arr: (string | "")[]) => {
  arr.forEach((ch, i) => {
    const node = screen.getByTestId(`otp-char-${i}`);
    const text =
      typeof node.props.children === "string"
        ? node.props.children
        : Array.isArray(node.props.children)
        ? node.props.children.join("")
        : String(node.props.children ?? "");
    expect(text).toBe(ch || " ");
  });
};

describe("OTP UI behavior", () => {
  test("fills digits into fixed positions without shifting", async () => {
    render(<App />);
    await typeDigitAt(0, "1");
    await typeDigitAt(1, "2");
    await typeDigitAt(2, "3");
    expectBoxToEqual(["1", "2", "3", "", "", ""]);
  });

  test("backspace clears only that position and does not shift", async () => {
    render(<App />);
    await typeDigitAt(0, "1");
    await typeDigitAt(1, "2");
    await typeDigitAt(2, "3");
    await backspaceAt(2);
    expectBoxToEqual(["1", "2", "", "", "", ""]);
  });

  test("auto-submit shows loading then success banner, and resets boxes", async () => {
    render(<App />);
    await typeDigitAt(0, "1");
    await typeDigitAt(1, "2");
    await typeDigitAt(2, "3");
    await typeDigitAt(3, "4");
    await typeDigitAt(4, "5");
    await typeDigitAt(5, "6");

    expect(screen.getByTestId("loading")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId("success-banner")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    expectBoxToEqual(["", "", "", "", "", ""]);
  });

  test("tap a box selects that digit for overwrite", async () => {
    render(<App />);
    await typeDigitAt(0, "1");
    await typeDigitAt(1, "9");
    await typeDigitAt(2, "9");

    fireEvent.press(screen.getByTestId("otp-box-1"));
    await typeDigitAt(1, "2");

    expectBoxToEqual(["1", "2", "9", "", "", ""]);
  });
});
