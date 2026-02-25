import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer   from './authSlice'
import searchReducer from './searchSlice'
import quotesReducer from './quotesSlice'
import adsReducer    from './adsSlice'
import mechanicReducer from './mechanicSlice'
import reviewsReducer from './reviewsSlice'

const rootReducer = combineReducers({
  auth:   authReducer,
  search: searchReducer,
  quotes: quotesReducer,
  ads:    adsReducer,
  mechanics: mechanicReducer,
  reviews: reviewsReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'quotes', 'search'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [
        'persist/PERSIST',
        'persist/REHYDRATE',
        'persist/PAUSE',
        'persist/FLUSH',
        'persist/PURGE',
        'persist/REGISTER',
      ],
    },
  }),
})

export const persistor = persistStore(store)

export type RootState  = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch