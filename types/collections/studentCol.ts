import { firestore } from "@/lib/storage/gcp/firestore";

export const studentCol = firestore.collection('students');