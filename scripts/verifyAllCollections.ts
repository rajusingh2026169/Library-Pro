import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

async function checkCollections() {
  const collectionNames = [
    'books',
    'members',
    'loans',
    'fines',
    'reservations',
    'users',
    'settings',
    'activity_logs',
    'rr_students',
    'rr_seats',
    'rr_plans',
    'rr_payments',
    'rr_attendance',
  ];

  console.log(`Checking Firestore Database: ${config.firestoreDatabaseId}`);
  for (const name of collectionNames) {
    try {
      const snap = await getDocs(collection(db, name));
      console.log(`Collection [${name}]: ${snap.size} documents`);
    } catch (err: any) {
      console.error(`Collection [${name}] Error:`, err.message);
    }
  }

  // Create an explicit verification record as requested by the user
  const verifyDocId = `verify_${Date.now()}`;
  console.log(`\nSaving verification record to books collection: ID ${verifyDocId}`);
  await setDoc(doc(db, 'books', verifyDocId), {
    id: verifyDocId,
    title: 'Verification: Cloud Firestore Live Persistence Test',
    author: 'AI Studio System Auditor',
    isbn: '978-CLOUD-VERIFIED',
    category: 'General Reference',
    shelfNumber: 'MAIN-AUDIT',
    callNumber: '000.1 AUD',
    totalCopies: 10,
    availableCopies: 10,
    language: 'English',
    description: 'This record was created during system verification to prove real-time two-way synchronization with Firebase Cloud Firestore.',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log('Verification record saved successfully!');

  process.exit(0);
}

checkCollections();
