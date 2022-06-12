import 'dotenv/config';

export const getSpotifyCredentials = async () => {
    let returnValue: any = {};
    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
        const encodedClientIdAndSecret = process.env.SPOTIFY_ENCODED;
        const spotifyCredentials = { clientId, clientSecret, redirectUri, encodedClientIdAndSecret };
        returnValue = spotifyCredentials;
    } catch (e) {
        returnValue = e;
    }
    return returnValue;
};

export const getFirebaseCredentials = async () => {
    let returnValue: any = {};
    try {
        const firebaseCredentials = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID,
        };
        returnValue = firebaseCredentials;
    } catch (error) {
        returnValue = error;
    }
    return returnValue;
};
