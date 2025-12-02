import { firestore } from "@/lib/storage/gcp/firestore";


export const quizCol = firestore.collection('quizzes');