import { createSelector, createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { checkout, CartItems } from "../../app/api"
import { AppDispatch, RootState } from "../../app/store";

type CheckoutState = "LOADING" | "READY" | "ERROR";

export interface cartState {
  items: { [productID: string]: number };
  checkoutState: CheckoutState;
  errorMessage: string;
}
// items: {
//     "123": 5,
//     "abc": 10,
//     "xyz": 15
// }
const initialState: cartState = {
  items: {},
  checkoutState: "READY",
  errorMessage: ''
};

//This generates action creators for the cart slice accordinh to this name: cart/checkout
//cart/checkout/pending
//cart/checkout/fulfilled
//cart/checkout/rejected
//thats why use it like this in extraReducers:
//checkoutCart.pending, checkoutCart.fulfilled, checkoutCart.rejected

//export const checkoutCart = createAsyncThunk("cart/checkout", async (items: CartItems) => {
//export const checkoutCart = createAsyncThunk<{success:boolean}, undefined, {state: RootState}>("cart/checkout", async (_, thunkAPI) => {  
export const checkoutCart = createAsyncThunk("cart/checkout", async (_, thunkAPI) => {  
  const state = thunkAPI.getState() as RootState;
  const items = state.cart.items;
  const response = await checkout(items);
  return response;
})

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<string>) {
      if (state.items[action.payload]) {
        state.items[action.payload]++;
      } else {
        state.items[action.payload] = 1;
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
    },
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const { id, quantity } = action.payload;
      state.items[id] = quantity;
    }    
  },
  extraReducers: function (builder) {     
    //builder.addCase("cart/checkout/pending", (state, action) => {
    builder.addCase(checkoutCart.pending, (state, action) => {
      state.checkoutState = "LOADING";
    })
    builder.addCase(checkoutCart.fulfilled, (state, action: PayloadAction<{success:boolean}>) => {
      const { success } = action.payload;
      if (success) {
        state.checkoutState = "READY";
        state.items = {}
      } else {
        state.checkoutState = "ERROR";
      }
    })
    builder.addCase(checkoutCart.rejected, (state, action) => {
      state.checkoutState = "ERROR";
      state.errorMessage = action.error.message || "";
    });
  }
});

/*
export function checkout() {
  return function checkoutThunk(dispatch: AppDispatch) {    
    dispatch({ type: "cart/checkout/pending" })
    setTimeout(function () {
      dispatch({ type: "cart/checkout/fulfilled" })
    }, 500);
  }
}*/

export const { addToCart, removeFromCart, updateQuantity } = cartSlice.actions;
export default cartSlice.reducer;

export function getNumItems(state: RootState) {
  console.log("calling getNumItems");
  let numItems = 0;
  for (let id in state.cart.items) {
    numItems += state.cart.items[id];
  }
  return numItems;
}

export const getMemoizedNumItems = createSelector(
  (state: RootState) => state.cart.items,
  (items) => {
    console.log("calling getMemoizedNumItems");
    let numItems = 0;
    for (let id in items) {
      numItems += items[id];
    }
    return numItems;
  }
);

export const getTotalPrice = createSelector(
  (state: RootState) => state.cart.items,
  (state: RootState) => state.products.products,
  (items, products) => {
    let total = 0;
    for (let id in items) {
      total += products[id].price * items[id];
    }
    return total.toFixed(2);
  }
);

/*
export const getTotalPrice = createSelector<RootState, any, any, string>(
  (state) => state.cart.items,
  (state) => state.products.products,
  (items, products) => {
    let total = 0;
    for (let id in items) {
      total += products[id].price * items[id];
    }
    return total.toFixed(2);
  }
);*/
