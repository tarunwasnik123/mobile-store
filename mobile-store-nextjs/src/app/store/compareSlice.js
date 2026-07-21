import { createSlice } from '@reduxjs/toolkit';

const loadInitial = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('compare:selected');
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((p) => ({ ...p, id: p.id || p.externalId || p._id }));
  } catch {
    return [];
  }
};

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    selected: loadInitial(),
  },
  reducers: {
    addPhone(state, action) {
      const phone = action.payload;
      if (state.selected.find((p) => p.id === phone.id)) return;
      if (state.selected.length >= 3) return;
      state.selected.push(phone);
    },
    removePhone(state, action) {
      const id = action.payload;
      state.selected = state.selected.filter((p) => p.id !== id);
    },
    clear(state) {
      state.selected = [];
    },
    setSelected(state, action) {
      state.selected = action.payload || [];
    },
  },
});

export const { addPhone, removePhone, clear, setSelected } = compareSlice.actions;
export default compareSlice.reducer;