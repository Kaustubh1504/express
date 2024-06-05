import Expo from "expo-server-sdk";
import { initializeApp } from "firebase/app";

import { getDatabase, ref, set, get, child } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_DB_URL,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGE_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID,
};

export const _ = initializeApp(firebaseConfig);

export const db = getDatabase();
const dbRef = ref(db);

export const saveToken = async (userId: string, token: string) => {
  const values = (await get(child(dbRef, `userTokens/${userId}/`))).val() ?? {};
  const payload = { ...values, token };
  set(ref(db, `userTokens/${userId}/`), payload);
};

export const getToken = async (userId: string) => {
  const values = (await get(child(dbRef, `userTokens/${userId}`))).val();
  return values ?? {};
};

const sendPushNotification = async (userId: string, notificationData: any) => {
  const tokenSnapshot = await get(child(dbRef, `userTokens/${userId}`));
  const token = tokenSnapshot.val();

  if (!token) {
    console.log("No token found for user", userId);
    return;
  }

  const expo = new Expo();
  const message = {
    to: token,
    // sound: "default",
    title: "New Follower",
    body: `${notificationData.userName} has started following you`,
    data: notificationData,
  };

  try {
    let ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log("ticketChunk:", ticketChunk);
  } catch (error) {
    console.error(error);
  }
};

export const handleFollowEvent = async (followerId: string, userId: string) => {
  const userRef = ref(db, `UserDB/${followerId}`);
  const snapshot = await get(userRef);
  const userDetails = snapshot.val();

  if (userDetails) {
    const userName = userDetails.fullName;
    // Send push notification
    await sendPushNotification(userId, {
      userName: userName,
      fromUserId: followerId,
    });
    return {
      userName: userName,
      fromUserId: followerId,
    };
  } else {
    throw new Error("No user details found for user ID: " + followerId);
  }
};
