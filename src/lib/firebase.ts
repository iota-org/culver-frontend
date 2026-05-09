import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD69whfURGYeSeZ6NKQxkH5ey09VHX4NQQ',
  authDomain: 'culver-d37b9.firebaseapp.com',
  projectId: 'culver-d37b9',
  storageBucket: 'culver-d37b9.firebasestorage.app',
  messagingSenderId: '852765886948',
  appId: '1:852765886948:web:069ad3a19c0d0c18965ff1',
  measurementId: 'G-LE1SDM76JE',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
