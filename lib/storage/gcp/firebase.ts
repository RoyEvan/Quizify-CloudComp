// Import the functions you need from the SDKs you need
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import gcloudCredentials from './gcloud';
// import { Analytics, getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const firebase = getApps().length === 0 
  ? initializeApp({
    credential: cert({
      projectId: gcloudCredentials.project_id,
      clientEmail: gcloudCredentials.client_email,
      privateKey: gcloudCredentials.private_key.replace(/\\n/g, '\n'),
    })
  })
  : getApp();

export { firebase };