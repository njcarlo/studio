import { gql } from 'graphql-tag';
import * as admin from 'firebase-admin';

// Re-initialize only if not already initialized
if (admin.apps.length === 0) {
  // We use the default environment in Firebase or need a Service Account locally
  admin.initializeApp();
}

const db = admin.firestore();

export const typeDefs = gql`
  """
  A worker's data visible to external applications.
  """
  type PublicWorker {
    id: ID!
    firstName: String!
    lastName: String!
    avatarUrl: String
    majorMinistryId: String
    status: String!
  }

  """
  Full worker details for authenticated internal use.
  """
  type Worker {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    status: String!
    avatarUrl: String
    majorMinistryId: String
    minorMinistryId: String
    birthDate: String
    roleId: String!
  }

  type Query {
    # Publicly accessible list (filtered fields)
    publicWorkers: [PublicWorker!]!
    
    # Internal full list
    workers: [Worker!]!
    
    worker(id: ID!): Worker
  }
`;

export const resolvers = {
  Query: {
    publicWorkers: async () => {
      const snapshot = await db.collection('workers').where('status', '==', 'Active').get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.avatarUrl,
          majorMinistryId: data.majorMinistryId,
          status: data.status,
        };
      });
    },
    workers: async () => {
      const snapshot = await db.collection('workers').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    worker: async (_: any, { id }: { id: string }) => {
      const doc = await db.collection('workers').doc(id).get();
      if (!doc.exists) return null;
      return {
        id: doc.id,
        ...doc.data()
      };
    }
  }
};
