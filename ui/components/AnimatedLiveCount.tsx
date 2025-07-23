import { Container } from "@/ui/elements";
import { colors, fontFamilies } from "@/ui/styles";
import React from "react";
import { StyleSheet, TextStyle } from "react-native";
import Animated, {
  AnimatedStyle,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function LiveCount(props: { lives: number }) {
  const { lives } = props;
  // Define color stops
  const colorStops = [
    colors.successGreen,
    colors.warningYellow,
    colors.errorRed,
  ];
  // Map lives to color progress: 3+ => 0, 2 => 0.5, 1 or less => 1
  const getColorProgress = (l: number) => (l >= 3 ? 0 : l === 2 ? 0.5 : 1);
  const colorProgress = useSharedValue(getColorProgress(lives));

  React.useEffect(() => {
    colorProgress.value = withSpring(getColorProgress(lives), {
      stiffness: 100,
      damping: 10,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    });
  }, [lives, colorProgress]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(colorProgress.value, [0, 0.5, 1], colorStops),
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [colors.successBg, colors.warningBg, colors.errorBg]
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(colorProgress.value, [0, 0.5, 1], colorStops),
  }));

  return (
    <Animated.View style={[styles.container, animatedBorderStyle]}>
      <Container style={{ flexDirection: "row", gap: 2 }}>
        <Animated.Text style={[{ fontSize: 12 }, animatedTextStyle]}>
          ♥
        </Animated.Text>
        <AnimatingDigit digit={lives} size={12} textStyle={animatedTextStyle} />
      </Container>
    </Animated.View>
  );
}

function AnimatingDigit(props: {
  digit: number;
  size: number;
  textStyle: AnimatedStyle<TextStyle>;
}) {
  const { digit, size, textStyle } = props;
  const DIGIT_HEIGHT = size * 1.2; // Adjust as needed for your font/line height
  const digits = Array.from({ length: 10 }).map((_, i) => 9 - i); // 9 at top, 0 at bottom
  const digitIndex = digits.indexOf(digit);

  const translateY = useSharedValue(-digitIndex * DIGIT_HEIGHT);

  React.useEffect(() => {
    translateY.value = withSpring(-digitIndex * DIGIT_HEIGHT, {
      stiffness: 100,
      damping: 10,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    });
  }, [digitIndex, DIGIT_HEIGHT, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Container style={[styles.digitContainer, { height: DIGIT_HEIGHT }]}>
      <Animated.View style={animatedStyle}>
        {digits.map((d) => (
          <Animated.Text
            key={d}
            style={[
              {
                height: DIGIT_HEIGHT,
                textAlign: "center",
                fontSize: size,
                fontFamily: fontFamilies.primary,
              },
              textStyle,
            ]}
          >
            {d}
          </Animated.Text>
        ))}
      </Animated.View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  digitContainer: {
    overflow: "hidden",
  },
});
