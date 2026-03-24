import { gql } from 'graphql-tag';
import { prisma } from '@studio/database/prisma';

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
      return prisma.worker.findMany({
        where: { status: 'Active' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          majorMinistryId: true,
          status: true,
        },
      });
    },
    workers: async () => {
      return prisma.worker.findMany();
    },
    worker: async (_: unknown, { id }: { id: string }) => {
      return prisma.worker.findUnique({ where: { id } });
    },
  },
};
