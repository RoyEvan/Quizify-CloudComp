import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import studentReducer from '../features/studentSlice';
import teacherReducer from '../features/teacherSlice';


export const makeStore = () => {
  return configureStore({
    reducer: {
      quizStudent: studentReducer,
      quizTeacher: teacherReducer
    }
  })
}


export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk = ThunkAction<void, RootState, unknown, Action>