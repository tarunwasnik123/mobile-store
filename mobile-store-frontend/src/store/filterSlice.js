import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  brands: [],
  price: [0, 200000],
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setBrands(state, action) {
      state.brands = action.payload || [];
    },
    setPrice(state, action) {
      state.price = action.payload || [0, 200000];
    },
    setFilters(state, action) {
      const { brands, price } = action.payload || {};
      state.brands = brands || [];
      state.price = price || [0, 200000];
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { setBrands, setPrice, setFilters, resetFilters } =
  filterSlice.actions;

export default filterSlice.reducer;
