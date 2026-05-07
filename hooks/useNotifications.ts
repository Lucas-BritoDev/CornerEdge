import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications').default;
  Device = require('expo-device');
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.log('[Notifications] Módulo não disponível em Expo Go');
}

export function useNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<any>(undefined);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!userId || !Notifications || !Device) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        supabase.from('profiles').update({ push_token: token }).eq('id', userId);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('Notification Response:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications || !Device) {
    console.log('[Notifications] Módulo não disponível, pulando registro');
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (e) {
      console.log('[Notifications] Erro ao criar canal:', e);
    }
  }

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId && Constants.executionEnvironment === 'storeClient') {
        console.log('Skipping push token registration in Expo Go.');
        return;
      }

      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId || '',
        })
      ).data;
      token = pushTokenString;
    } catch (e: unknown) {
      console.log('Error getting push token. This is normal in Expo Go:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
