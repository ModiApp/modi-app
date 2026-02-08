import { Container } from "@/ui/elements";
import ScreenContainer from "@/ui/elements/Screen";
import { colors, fontFamilies, fontSizes } from "@/ui/styles";
import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonBar({
  width,
  height = 20,
  style,
}: {
  width: number | string;
  height?: number;
  style?: any;
}) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: "rgba(255,255,255,0.3)",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function GameScreenSkeleton() {
  const buttonOpacity = usePulse();

  return (
    <ScreenContainer>
      <Container style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Top section: Game PIN placeholder + Invite button placeholder */}
        <Container
          style={{
            justifyContent: "center",
            paddingTop: 28,
            paddingVertical: 32,
            alignItems: "center",
            gap: 12,
          }}
        >
          <SkeletonBar width={180} height={24} />
          <SkeletonBar width={140} height={16} />
        </Container>

        {/* Middle section: CardTable circle */}
        <Container style={{ flex: 1, marginBottom: 16 }}>
          <Container
            color="lightGreen"
            style={{
              aspectRatio: 1,
              borderRadius: 999,
              maxWidth: 600,
              maxHeight: 600,
              width: "100%",
              position: "relative",
              alignSelf: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Card deck placeholder in center */}
            <SkeletonBar width={60} height={80} style={{ borderRadius: 8 }} />
          </Container>
        </Container>

        {/* Bottom section: Button placeholder */}
        <Container
          style={{
            flexDirection: "row",
            minHeight: 24,
            gap: 16,
            width: "100%",
          }}
        >
          <Animated.View
            style={{
              flex: 1,
              height: 48,
              borderRadius: 8,
              backgroundColor: colors.blue,
              opacity: buttonOpacity,
            }}
          />
        </Container>
      </Container>
    </ScreenContainer>
  );
}
