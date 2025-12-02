import { firestore } from "@/lib/storage/gcp/firestore";

export const studentQuestionCol = firestore.collection('student_questions');