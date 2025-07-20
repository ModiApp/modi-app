import {
  createRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, LayoutRectangle } from "react-native";
import { Container, Icon, Text } from "../elements";
import { colors } from "../styles";

type ShowBannerConfig = {
  message: string;
  type: AlertType;
};

const AlertTypes = ["error", "success", "info", "warning"] as const;
type AlertType = (typeof AlertTypes)[number];

interface BannerRefType {
  show(config: ShowBannerConfig): void;
}

const BannerRef = createRef<BannerRefType>();

export function AlertBanner() {
  const [config, setConfig] = useState<ShowBannerConfig | null>(null);
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const animation = useRef(new Animated.Value(1)).current;
  const translateY = useMemo(() => {
    return animation.interpolate({
      inputRange: [0, 1],
      outputRange: [-(layout?.height || 0), 0],
    });
  }, [layout, animation]);

  useImperativeHandle(BannerRef, () => ({
    show(config: ShowBannerConfig) {
      setConfig(config);
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setConfig(null);
      });
    },
  }));

  if (!config) return null;

  const alertStyles = getAlertConfig(config.type);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        opacity: animation,
        padding: 16,
      }}
      onLayout={({ nativeEvent: { layout } }) => {
        setLayout(layout);
      }}
    >
      <Container
        style={{
          backgroundColor: alertStyles?.bgColor,
          borderLeftWidth: 6,
          borderLeftColor: alertStyles?.iconColor,
          borderRadius: "12px",
          padding: 16,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Container
          style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
        >
          <Icon
            name={alertStyles?.iconName}
            size={24}
            color={alertStyles?.iconColor}
          />
          <Container style={{ flex: 1 }}>
            <Text color="darkText" fontFamily="alert">
              {config.message}
            </Text>
          </Container>
        </Container>
      </Container>
    </Animated.View>
  );
}

type AlertConfig = Omit<ShowBannerConfig, "type">;
export const Alert = AlertTypes.reduce((acc, type) => {
  acc[type] = (config: AlertConfig) => {
    BannerRef.current?.show({ ...config, type });
  };
  return acc;
}, {} as Record<AlertType, (config: AlertConfig) => void>);

const getAlertConfig = (type: AlertType) => {
  const configs = {
    error: {
      iconName: "alert-circle",
      bgColor: colors.errorBg,
      borderColor: colors.errorBorder,
      iconColor: colors.errorRed,
    },
    success: {
      iconName: "checkmark-circle",
      bgColor: colors.successBg,
      borderColor: colors.successBorder,
      iconColor: colors.successGreen,
    },
    warning: {
      iconName: "warning",
      bgColor: colors.warningBg,
      borderColor: colors.warningBorder,
      iconColor: colors.warningYellow,
    },
    info: {
      iconName: "information-circle",
      bgColor: colors.infoBg,
      borderColor: colors.infoBorder,
      iconColor: colors.blue,
    },
  } as const;
  return configs[type] || configs.info;
};
