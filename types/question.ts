interface Question {
  _id: string;
  rand_seq: number;
  question_id: number;
  title: string;
  img: string | undefined;
  answer: string | number | boolean;
  answers: Array<string|number> | undefined;
  answered: string;
  type: string;

  // Functions/Methods
  updateAnswer: (data: string | number | boolean) => void;
}

export default Question;