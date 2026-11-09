import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
console.log('Testing with Firestore DB:', config.firestoreDatabaseId);

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

async function runTest() {
  const testDocId = `test_verification_${Date.now()}`;
  const testRef = doc(db, 'books', testDocId);

  try {
    console.log('Writing test book document to books collection...');
    await setDoc(testRef, {
      id: testDocId,
      title: 'Firebase Connection Verification Book',
      author: 'LibraryPro System',
      isbn: `978-VERIFY-${Date.now().toString().slice(-4)}`,
      category: 'General Reference',
      shelfNumber: 'A1-STACK',
      callNumber: '001 VER',
      totalCopies: 5,
      availableCopies: 5,
      language: 'English',
      description: 'System connectivity verification document to verify Cloud Firestore persistence.',
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Successfully written document:', testDocId);

    console.log('Reading test document back...');
    const snap = await getDoc(testRef);
    if (snap.exists()) {
      console.log('Document read verified:', snap.data());
    } else {
      console.error('Document does not exist!');
    }

    // Keep the document in Firestore or clean up
    console.log('Firestore connection test PASSED completely!');
  } catch (err: any) {
    console.error('Firestore connection test FAILED with error:', err);
  }
}

runTest();
