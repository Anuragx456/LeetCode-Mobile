import { useNavigation } from '@react-navigation/native'
import { useLayoutEffect, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/lib/theme'

type Nav = {
  getParent: () => Nav | undefined
  getState?: () => { type?: string }
  setOptions: (options: { tabBarStyle: ViewStyle | { display: string } }) => void
}

export function useTabBarStyle(): ViewStyle {
  const insets = useSafeAreaInsets()
  return useMemo(
    () => ({
      backgroundColor: colors.tabBar,
      borderTopColor: 'rgba(255,255,255,0.07)',
      borderTopWidth: 1,
      height: 56 + insets.bottom,
      paddingTop: 6,
      paddingBottom: Math.max(insets.bottom, 8),
    }),
    [insets.bottom]
  )
}

export function useHideTabBar() {
  const navigation = useNavigation() as unknown as Nav
  const tabBarStyle = useTabBarStyle()

  useLayoutEffect(() => {
    let parent = navigation.getParent()
    while (parent && parent.getState?.()?.type !== 'tab') {
      parent = parent.getParent()
    }
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle })
  }, [navigation, tabBarStyle])
}