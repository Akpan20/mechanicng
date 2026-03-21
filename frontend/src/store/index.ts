import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer   from './authSlice'
import searchReducer from './searchSlice'
import quotesReducer from './quotesSlice'
import adsReducer    from './adsSlice'
import mechanicReducer from './mechanicSlice'
import reviewsReducer from './reviewsSlice'

const authPersistConfig = {
  key:       'auth',
  storage,
  whitelist: ['user', 'token'],
  // blacklist: ['error', 'loading'], // optional, but whitelist is cleaner
}

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)

// ---- Root reducer combining all slices ----
const rootReducer = combineReducers({
  auth:      persistedAuthReducer,
  search:    searchReducer,
  quotes:    quotesReducer,
  ads:       adsReducer,
  mechanics: mechanicReducer,
  reviews:   reviewsReducer,
})

// ---- Root persistence config (only for slices that need it) ----
const rootPersistConfig = {
  key: 'root',
  storage,
  whitelist: ['quotes', 'search'], 
}

const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer)

// ---- Store configuration ----
export const store = configureStore({
  reducer: persistedRootReducer,
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