const e = import.meta.env;
export const firebaseConfigured = Boolean(
  e.VITE_FIREBASE_API_KEY &&
    e.VITE_FIREBASE_PROJECT_ID &&
    e.VITE_FIREBASE_APP_ID &&
    e.VITE_FIREBASE_AUTH_DOMAIN &&
    e.VITE_FIREBASE_STORAGE_BUCKET,
);
let runtimePromise;
async function runtime() {
  if (!firebaseConfigured)
    throw new Error("أضف إعدادات Firebase لتفعيل الحفظ السحابي.");
  if (!runtimePromise)
    runtimePromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/storage"),
      import("firebase/firestore"),
    ]).then(([appModule, authModule, storageModule, firestoreModule]) => {
      const app = appModule.initializeApp({
        apiKey: e.VITE_FIREBASE_API_KEY,
        authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: e.VITE_FIREBASE_PROJECT_ID,
        storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
        appId: e.VITE_FIREBASE_APP_ID,
      });
      return {
        app,
        auth: authModule.getAuth(app),
        authModule,
        storageModule,
        firestoreModule,
      };
    });
  return runtimePromise;
}
export async function getUser() {
  const r = await runtime();
  await r.auth.authStateReady();
  return (
    r.auth.currentUser || (await r.authModule.signInAnonymously(r.auth)).user
  );
}
export async function saveDesign(image, metadata) {
  const r = await runtime();
  const user = await getUser();
  const id = crypto.randomUUID();
  const s = r.storageModule,
    f = r.firestoreModule;
  const imageRef = s.ref(
    s.getStorage(r.app),
    `users/${user.uid}/designs/${id}.png`,
  );
  await s.uploadString(imageRef, image, "data_url");
  const url = await s.getDownloadURL(imageRef);
  await f.addDoc(
    f.collection(f.getFirestore(r.app), "users", user.uid, "designs"),
    { ...metadata, imageUrl: url, createdAt: f.serverTimestamp() },
  );
  return url;
}
