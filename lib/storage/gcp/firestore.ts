import { Firestore, getFirestore } from "firebase-admin/firestore";
import { firebase } from "./firebase";

const firestore: Firestore = getFirestore(firebase, 'quizify');

export { firestore };