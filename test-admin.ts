import admin from "firebase-admin";
import fs from "fs";
import path from "path";

try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Init OK");
  const db = admin.firestore();
  db.collection('test').doc('ping').set({ ping: "pong" }).then(() => {
    console.log("Write OK");
    process.exit(0);
  }).catch(e => {
    console.error("Write error:", e);
    process.exit(1);
  });
} catch (e) {
  console.error("Init error:", e);
  process.exit(1);
}
