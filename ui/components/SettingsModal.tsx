import { Text } from "@/ui/elements";
import { colors } from "@/ui/styles";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const MOBILE_BREAKPOINT = 768;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SettingsModal({
  visible,
  onClose,
  title,
  children,
}: SettingsModalProps) {
  const { width } = useWindowDimensions();
  const isMobileSize = width < MOBILE_BREAKPOINT;

  if (!isMobileSize) {
    return (
      <DesktopModal visible={visible} onClose={onClose} title={title}>
        {children}
      </DesktopModal>
    );
  }

  return (
    <MobileBottomSheet visible={visible} onClose={onClose} title={title}>
      {children}
    </MobileBottomSheet>
  );
}

function DesktopModal({
  visible,
  onClose,
  title,
  children,
}: SettingsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.desktopBackdrop} onPress={onClose}>
        <Pressable
          style={styles.desktopModal}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text size={24} style={styles.title}>
              {title}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text size={20}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MobileBottomSheet({
  visible,
  onClose,
  title,
  children,
}: SettingsModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["40%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <Text size={22} style={styles.bottomSheetTitle}>
          {title}
        </Text>
        <View style={styles.content}>{children}</View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  // Desktop Modal Styles
  desktopBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  desktopModal: {
    backgroundColor: colors.feltGreen,
    borderRadius: 16,
    padding: 24,
    minWidth: 320,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: colors.white,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 16,
  },
  // Mobile Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: colors.feltGreen,
  },
  handleIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  bottomSheetTitle: {
    color: colors.white,
    marginBottom: 24,
    textAlign: "center",
  },
});
