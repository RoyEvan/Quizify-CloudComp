// THIS IS A HELPER FILE FOR ASYNC THUNK IN TS


import { createAsyncThunk } from '@reduxjs/toolkit'

import type { RootState, AppDispatch } from '../store/store'

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: AppDispatch
}>()
