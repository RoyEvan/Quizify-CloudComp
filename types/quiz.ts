interface Quiz {
  _id: string;
  title: string;
  created_at: Date;
  opened_at: Date;
  ended_at: Date;
  access_code: string;
  teacher_id: string;
  student_attempt: Array<string>;
  student_joined: Array<string>;
  questions: Array<object>;
  score: string;
}

export default Quiz;