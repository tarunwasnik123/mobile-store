import { configureStore } from '@reduxjs/toolkit';
import compareReducer from './compareSlice';
import filterReducer from './filterSlice';

export const store = configureStore({
  reducer: {
    compare: compareReducer,
    filters: filterReducer,
  },
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    try {
      const state = store.getState();
      localStorage.setItem('compare:selected', JSON.stringify(state.compare.selected || []));
    } catch {}
  });
}

export default store;