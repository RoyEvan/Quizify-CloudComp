import { RootState } from "@/lib/store/store";
import { createSlice } from "@reduxjs/toolkit";
import { client } from "./client";
import { createAppAsyncThunk } from "./withTypes";
import Student from "@/types/student";

// GET ALL STUDNET QUIZ HISTORY (JOIN & ATTEMPT)

const fetchStudentAllQuiz = createAppAsyncThunk(
  "student/fetchAllStudentQuiz",
  async (
    { noParam }: { noParam?: string } = { noParam: "yes" },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.get<[]>("/api/student/quiz");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  },
  {
    condition(arg, thunkApi) {
      const quizStatus = selectStudentStatus(thunkApi.getState());
      if (quizStatus != "idle") {
        return false;
      }
    },
  }
);

const fetchStudentQuizDetail = createAppAsyncThunk(
  "student/fetchStudentQuizDetail",
  async ({ quiz_id }: { quiz_id: string }, { rejectWithValue }) => {
    try {
      const response = await client.get<[]>(`/api/student/quiz/${quiz_id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  },
  {
    condition(arg, thunkApi) {
      const quizStatus = selectStudentStatus(thunkApi.getState());
      if (quizStatus != "idle") {
        return false;
      }
    },
  }
);

// GET QUIZ THAT STUDENT ATTEMPTED RIGHT NOW
const fetchStudentQuizActive = createAppAsyncThunk(
  "student/fetchStudentQuizActive",
  async (
    { noParam }: { noParam?: string } = { noParam: "yes" },
    { rejectWithValue }
  ) => {
    try {
      console.log("SJAK")
      const response = await client.get<[]>("/api/student/quiz/questions");
      console.log(response.data)
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  },
  {
    condition(arg, thunkApi) {
      const quizStatus = selectStudentStatus(thunkApi.getState());
      if (quizStatus != "idle") {
        return false;
      }
    },
  }
);

// POST STUDENT JOIN QUIZ

const postStudentJoinQuiz = createAppAsyncThunk(
  "student/postStudentJoinQuiz",
  async ({ access_code }: { access_code: string }, { rejectWithValue }) => {
    try {
      const response = await client.post<string>("/api/student/quiz/join", {
        access_code,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

// POST STUDENT ATTEMPT QUIZ

const postStudentAttemptQuiz = createAppAsyncThunk(
  "student/postStudentAttemptQuiz",
  async ({ quiz_id }: { quiz_id: string }, { rejectWithValue }) => {
    try {
      const response = await client.post<string>("/api/student/quiz/attempt", {
        quiz_id: quiz_id,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); 
    }
  }
);

// PUT UPDATE ANSWER

const putStudentUpdateAnswer = createAppAsyncThunk(
  "student/putStudentUpdateAnswer",
  async ({ quiz_id, question_id, new_answer }, { rejectWithValue }) => {
    try {
      const response = await client.put<string>("/api/student/questions", {
        quiz_id,
        question_id,
        new_answer,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

// PATCH SAVE/UNSAVE QUESTION

const patchStudentSaveUnsaveQuestion = createAppAsyncThunk(
  "student/patchStudentSaveUnsaveQuestion",
  async ({ quiz_id, question_id }, { rejectWithValue }) => {
    try {
      const response = await client.patch<string>("/api/student/questions", {
        quiz_id,
        question_id,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

// POST STUDENT SUBMIT QUIZ

const postStudentSubmitQuiz = createAppAsyncThunk(
  "student/postStudentSubmitQuiz",
  async ({}, { rejectWithValue }) => {
    try {
      const response = await client.post<string>("/api/student/quiz/", {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

const initialState: Student = {
  quizActive: null,
  quizAttempted: null,
  quizDetail: null,
  quizJoined: [],
  quizDone: [],
  status: "idle",
  error: null,
  msg: "",
  _id: "",
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // GET HISTORY QUIZ STUDENT

      .addCase(fetchStudentAllQuiz.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(fetchStudentAllQuiz.fulfilled, (state, action) => {
        state.quizAttempted = action.payload.quiz_attempt;
        state.quizJoined = action.payload.quiz_joined;
        state.quizDone = action.payload.quiz_done;
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(fetchStudentAllQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // GET DETAIL QUIZ STUDENT

      .addCase(fetchStudentQuizDetail.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(fetchStudentQuizDetail.fulfilled, (state, action) => {
        state.quizDetail = action.payload;
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })

      // GET QUIZ ACTIVE STUDENT

      .addCase(fetchStudentQuizActive.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(fetchStudentQuizActive.fulfilled, (state, action) => {
        state.quizActive = action.payload;
        console.log(action.payload)
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(fetchStudentQuizActive.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
        console.log(action.payload)

      })

      // JOIN QUIZ STUDENT

      .addCase(postStudentJoinQuiz.pending, (state, action) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(postStudentJoinQuiz.fulfilled, (state, action) => {
        state.quizJoined.unshift(action.payload.data);
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(postStudentJoinQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // ATTEMPT QUIZ STUDENT

      .addCase(postStudentAttemptQuiz.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(postStudentAttemptQuiz.fulfilled, (state, action) => {
        state.quizAttempted = action.payload.data;
        state.quizJoined = state.quizJoined.filter((quiz) => {
          return quiz._id !== action.payload.data._id;
        });

        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(postStudentAttemptQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // UPDATE ANSWER

      .addCase(putStudentUpdateAnswer.pending, (state, action) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(putStudentUpdateAnswer.fulfilled, (state, action) => {
        const questionToUpdate = state.quizActive.questions.find(
          (question) => question.id === action.payload.data.question_id
        );

        if (questionToUpdate) {
          questionToUpdate.answer = action.payload.data.answer;
          questionToUpdate.answered = action.payload.data.answered;
        }

        state.status = "succeeded";
        // Message Tidak Dilempar untuk menghindari alert yang berulang
        // state.msg = action.payload.msg;
      })
      .addCase(putStudentUpdateAnswer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
      })

      // SAVE/UNSAVE QUESTION

      .addCase(patchStudentSaveUnsaveQuestion.pending, (state, action) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(patchStudentSaveUnsaveQuestion.fulfilled, (state, action) => {
        const questionToUpdate = state.quizActive.questions.find(
          (question) => question.id === action.payload.data.question_id
        );

        if (questionToUpdate) {
          questionToUpdate.answered = action.payload.data.answered;
        }

        state.status = "succeeded";
        // Message Tidak Dilempar untuk menghindari alert yang berulang
        // state.msg = action.payload.msg;
      })
      .addCase(patchStudentSaveUnsaveQuestion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // SUBMIT QUIZ

      // .addCase(postStudentSubmitQuiz.fulfilled, (state, action) => {
      .addCase(postStudentSubmitQuiz.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(postStudentSubmitQuiz.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(postStudentSubmitQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      });
  },
});

export const studentAction = {
  fetchStudentAllQuiz,
  fetchStudentQuizDetail,
  postStudentJoinQuiz,
  postStudentAttemptQuiz,
  fetchStudentQuizActive,
  putStudentUpdateAnswer,
  patchStudentSaveUnsaveQuestion,
  postStudentSubmitQuiz,
};

export default studentSlice.reducer;

export const selectStudentQuizAttempted = (state: RootState) =>
  state.quizStudent.quizAttempted;
export const selectStudentQuizJoined = (state: RootState) =>
  state.quizStudent.quizJoined;
export const selectStudentQuizDone = (state: RootState) =>
  state.quizStudent.quizDone;
export const selectStudentQuizActive = (state: RootState) =>
  state.quizStudent.quizActive;
export const selectStudentQuizDetail = (state: RootState) =>
  state.quizStudent.quizDetail;

export const selectStudentStatus = (state: RootState) =>
  state.quizStudent.status;
export const selectStudentMessage = (state: RootState) => state.quizStudent.msg;
export const selectStudentError = (state: RootState) => state.quizStudent.error;
