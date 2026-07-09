/**
 * CustomTabBar.tsx
 * Place this file at: components/CustomTabBar.tsx
 *
 * Pill-shaped floating bottom tab bar.
 * - Focused tab  → icon + label inside a highlighted pill
 * - Unfocused tab → label only, no background
 * - Right side    → circular action button (search / lens)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.pill}>
        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Resolve label: prefer tabBarLabel string → title → route name
          const label: string =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                isFocused && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              {/* Icon shown only when focused */}
              {isFocused && options.tabBarIcon ? (
                <View style={styles.iconWrap}>
                  {options.tabBarIcon({ focused: true, color: colors.lime, size: 16 })}
                </View>
              ) : null}

              {/* Label always shown */}
              <Text
                style={[
                  styles.label,
                  isFocused ? styles.labelActive : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}

        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Outer container — floats above screen content */
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  /* Dark pill shell */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tabBar,
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 5,
    gap: 3,
    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.45)',
  },

  /* Individual tab button */
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 50,
    gap: 5,
  },

  /* Focused tab gets a lighter inner pill */
  tabActive: {
    backgroundColor: colors.tabBarActive,
  },

  /* Subtle opacity feedback on press */
  tabPressed: {
    opacity: 0.75,
  },

  /* Icon container keeps size predictable */
  iconWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Shared label base */
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  labelActive: {
    color: colors.lime,
  },

  labelInactive: {
    color: 'rgba(235, 235, 245, 0.65)',
  },

  /* Circular action button on the right */
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.tabBarActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
