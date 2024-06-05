const { initializeApp } = require("firebase/app");
const { getDatabase, ref, update, get } = require("firebase/database");
const cron = require("node-cron")
require("dotenv").config();

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_DB_URL,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGE_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const resetKarma = async () => {
    cron.schedule('0 0 * * *', () => {
        console.log('Resetting daily karma points...');
        updateKarmaForAllUsers("yesterday","today");
      });
      
      // Cron job to reset weekly karma points at 00:00 every Monday
      cron.schedule('0 0 * * 1', () => {
        console.log('Resetting weekly karma points...');
        updateKarmaForAllUsers("prevWeek","weekly");
      });
      
      // Cron job to reset monthly karma points at 00:00 on the 1st of every month
      cron.schedule('0 0 1 * *', () => {
        console.log('Resetting monthly karma points...');
        updateKarmaForAllUsers("prevMonth","monthly");
      });      
}

async function updateKarmaForAllUsers(prev,current) {
    try {
        const userDBRef = ref(db, 'UserDB');
        
        // Retrieve all users
        const snapshot = await get(userDBRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            const updates = {};
            
            // Iterate over each user and prepare update
            for (const userId in users) {
                if (users.hasOwnProperty(userId)) {
                    const currentTodayKarma = users[userId]?.karma[current] || 0;
                    updates[`UserDB/${userId}/karma/${prev}`] = currentTodayKarma;
                    updates[`UserDB/${userId}/karma/${current}`] = 0;
                }
            }
            
            // Perform the update
            await update(ref(db), updates);
            console.log('Karma updated for all users.');
        } else {
            console.log('No users found.');
        }
    } catch (error) {
        console.error('Error updating karma:', error);
    }
}

module.exports={
    resetKarma,
}