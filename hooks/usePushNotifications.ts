import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Importação condicional - expo-notifications não funciona na web
let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants').default;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<any>(undefined);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Não rodar na web
    if (Platform.OS === 'web' || !Notifications) return;

    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (token) {
          setExpoPushToken(token);
          const { data: user } = await supabase.auth.getUser();
          if (user?.user) {
            await supabase.from('profiles').update({ push_token: token }).eq('id', user.user.id);
          }
        }
      })
      .catch((error: any) => setExpoPushToken(`${error}`));

    notificationListener.current = Notifications.addNotificationReceivedListener((n: any) => {
      setNotification(n);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !Notifications || !Device) return;

  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
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
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants?.expoConfig?.extra?.eas?.projectId || 'your-project-id',
      })
    ).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

