import { firestore } from "@/lib/storage/gcp/firestore";

export const teacherCol = firestore.collection('teachers');