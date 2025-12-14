import { RootState } from "@/lib/store/store";
import { createSlice } from "@reduxjs/toolkit";
import { client } from "./client";
import { createAppAsyncThunk } from "./withTypes";
import Teacher from "@/types/teacher";

const fetchTeacherAllQuiz = createAppAsyncThunk(
  "student/fetchTeacherAllQuiz",
  async (
    { noParam }: { noParam?: string } = { noParam: "yes" },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.get<[]>("/api/teacher/quiz/");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  },
  {
    condition(arg, thunkApi) {
      const quizStatus = selectTeacherStatus(thunkApi.getState());
      if (quizStatus != "idle") {
        return false;
      }
    },
  }
);

const fetchTeacherQuizActive = createAppAsyncThunk(
  "teacher/fetchTeacherQuizActive",
  // async (quiz_id) => {
  async (quiz_id: string) => {
    try {
      const response = await client.get<[]>(`/api/teacher/quiz/${quiz_id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  },
  {
    condition(arg, thunkApi) {
      const quizStatus = selectTeacherStatus(thunkApi.getState());
      if (quizStatus != "idle") {
        return false;
      }
    },
  }
);

const fetchTeacherQuizCheck = createAppAsyncThunk(
  "teacher/fetchTeacherQuizCheck",
  async (
    { quiz_id, student_id }: { quiz_id: string; student_id: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.get<[]>(
        `/api/teacher/quiz/${quiz_id}/corrections/${student_id}`
      );
      console.log(response.data, "FETCH TEACHER QUIZ CHECK DATA");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  },
  {
    condition(arg, thunkApi) {
      const quizStatus = selectTeacherStatus(thunkApi.getState());
      if (quizStatus != "idle") {
        return false;
      }
    },
  }
);

const postTeacherCreateQuiz = createAppAsyncThunk(
  "teacher/postTeacherCreateQuiz",
  async (
    {
      title,
      opened_at,
      ended_at,
      access_code,
    }: {
      title: string;
      opened_at: string;
      ended_at: string;
      access_code: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.post<string>("/api/teacher/quiz", {
        title,
        opened_at,
        ended_at,
        access_code,
      });
      return response.data;
    } catch (error: any) {
      console.error("API Error:", error); // Log the error for debugging
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

const deleteTeacherQuestion = createAppAsyncThunk(
  "teacher/deleteTeacherQuestion",
  async ({ quiz_id, question_id }, { rejectWithValue }) => {
    try {
      const response = await client.delete<string>(
        `/api/teacher/quiz/${quiz_id}/questions`,
        {
          question_id: question_id,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error:", error); // Log the error for debugging
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

const deleteTeacherQuiz = createAppAsyncThunk(
  "teacher/deleteTeacherQuiz",
  async (quiz_id, { rejectWithValue }) => {
    try {
      const response = await client.delete<string>("/api/teacher/quiz", {
        quiz_id: quiz_id,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

const putTeacherQuizNilai = createAppAsyncThunk(
  "teacher/putTeacherQuizNilai",
  async ({ quiz_id, student_id, questions, result }, { rejectWithValue }) => {
    try {
      const response = await client.put<[]>(
        `/api/teacher/quiz/${quiz_id}/corrections/${student_id}`,
        {
          questions,
          result,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error:", error); // Log the error for debugging
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

const postTeacherAddQuestion = createAppAsyncThunk(
  "teacher/postTeacherAddQuestion",
  async (
    { quiz_id, formData }: { quiz_id: string; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await client.post<string>(
        `/api/teacher/quiz/${encodeURIComponent(quiz_id)}/questions`,
        formData
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error:", error); // Log the error for debugging
      return rejectWithValue(error); // Use rejectWithValue to pass the error message
    }
  }
);

const initialState: Teacher = {
  quizCheck: null,
  quizActive: null,
  quiz: [],
  status: "idle",
  error: null,
  msg: "",
  _id: ""
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    updateNilai: (state, action) => {
      const question_id = action.payload.question_id;
      const nilai = action.payload.nilai;

      const soalDinilai = state.quizCheck.questions.find(
        (question) => question.id === question_id
      );

      if (!soalDinilai) return; 

      if (soalDinilai.corrected) {
        state.quizCheck.result.score -= soalDinilai.correct_answer;
        state.quizCheck.result.score += nilai;
        soalDinilai.correct_answer = nilai;
      } else {
        state.quizCheck.result.score += nilai;
        soalDinilai.correct_answer = nilai;
        soalDinilai.corrected = true;
        state.quizCheck.result.corrected += 1;
      }

    },
  },
  extraReducers: (builder) => {
    builder
      // GET QUIZ ALL TEACHER

      .addCase(fetchTeacherAllQuiz.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(fetchTeacherAllQuiz.fulfilled, (state, action) => {
        state.quiz = action.payload;
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(fetchTeacherAllQuiz.rejected, (state, action) => {
        state.status = "failed";
        console.log("EOEOOEOEO", action);
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // GET QUIZ DETAIL / ACTIVE TEACHER
      .addCase(fetchTeacherQuizActive.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(fetchTeacherQuizActive.fulfilled, (state, action) => {
        state.quizActive = action.payload;
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(fetchTeacherQuizActive.rejected, (state, action) => {
        state.status = "failed";
        console.log(action.payload);
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // GET QUIZ BEING CHECKED
      .addCase(fetchTeacherQuizCheck.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(fetchTeacherQuizCheck.fulfilled, (state, action) => {
        state.quizCheck = action.payload;
        state.status = "succeeded";
        // Tidak di Return untuk menghindari alert berlebih
        // state.msg = action.payload.msg;
      })
      .addCase(fetchTeacherQuizCheck.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // CREATE QUIZ TEACHER

      .addCase(postTeacherCreateQuiz.pending, (state, action) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(postTeacherCreateQuiz.fulfilled, (state, action) => {
        state.quiz.unshift(action.payload.data);
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })

      .addCase(postTeacherCreateQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // DELETE QUIZ TEACHER

      .addCase(deleteTeacherQuiz.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(deleteTeacherQuiz.fulfilled, (state, action) => {
        state.quiz = state.quiz.filter(
          (quiz) => quiz._id !== action.payload.data.quiz_id
        );

        state.status = "succeeded";
        state.msg = action.payload.msg;
      })

      .addCase(deleteTeacherQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // ADD QUESTION TEACHER

      .addCase(postTeacherAddQuestion.pending, (state, action) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(postTeacherAddQuestion.fulfilled, (state, action) => {
        console.log("AWIKOWK", action.payload);

        state.quizActive.questions.push(action.payload.data);

        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(postTeacherAddQuestion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // DELETE QUESTION TEACHER
      .addCase(deleteTeacherQuestion.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(deleteTeacherQuestion.fulfilled, (state, action) => {
        state.quizActive.questions = state.quizActive.questions.filter(
          (question) => question.id !== action.payload.data.question_id
        );

        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(deleteTeacherQuestion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      })

      // PUT SUBMIT NILAI
      .addCase(putTeacherQuizNilai.pending, (state) => {
        state.error = "";
        state.msg = "";
        state.status = "pending";
      })
      .addCase(putTeacherQuizNilai.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.msg = action.payload.msg;
      })
      .addCase(putTeacherQuizNilai.rejected, (state) => {
        state.status = "failed";
        state.error = action.payload.status;
        state.msg = action.payload.message;
      });
  },
});

export const teacherAction = {
  fetchTeacherAllQuiz,
  fetchTeacherQuizActive,
  fetchTeacherQuizCheck,

  postTeacherCreateQuiz,
  postTeacherAddQuestion,
  putTeacherQuizNilai,

  deleteTeacherQuiz,
  deleteTeacherQuestion,
};

export const teacherReducerAction = teacherSlice.actions;

export default teacherSlice.reducer;

export const selectTeacherQuizCreated = (state: RootState) => state.quizTeacher.quiz;
export const selectTeacherQuizActive = (state: RootState) => state.quizTeacher.quizActive;
export const selectTeacherQuizCheck = (state: RootState) => state.quizTeacher.quizCheck;
export const selectTeacherMessage = (state: RootState) => state.quizTeacher.msg;
export const selectTeacherStatus = (state: RootState) => state.quizTeacher.status;
export const selectTeacherError = (state: RootState) => state.quizTeacher.error;
