import { OperationType, FirestoreErrorInfo } from '../types/firestore';

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authInfo?: FirestoreErrorInfo['authInfo']
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: authInfo || {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
