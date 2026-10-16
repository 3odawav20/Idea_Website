// IndexedDB stores full images without localStorage's small string quota.
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("idea-ceramic-studio", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("designs", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("تعذر فتح مساحة حفظ التصميمات في المتصفح."));
  });
}
export async function listLocalDesigns() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("designs", "readonly");
    const r = tx.objectStore("designs").getAll();
    tx.oncomplete = () => {
      db.close();
      resolve(r.result.sort((a, b) => b.timestamp - a.timestamp));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function saveLocalDesign(item) {
  const current = await listLocalDesigns();
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("designs", "readwrite");
    const store = tx.objectStore("designs");
    store.put(item);
    for (const old of current.slice(3)) store.delete(old.id);
    tx.oncomplete = () => {
      db.close();
      resolve([item, ...current].slice(0, 4));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
