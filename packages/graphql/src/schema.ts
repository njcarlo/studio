import { gql } from 'graphql-tag';
import { GraphQLError } from 'graphql';
import { prisma } from '@studio/database/prisma';

export type GraphQLContext = {
  callerCtx: { isSuperAdmin: boolean; permissions: Set<string> } | null;
};

function requireWorkersView(context: GraphQLContext) {
  const ctx = context.callerCtx;
  if (!ctx) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  if (!ctx.isSuperAdmin && !ctx.permissions.has('workers:view')) {
    throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
  }
}

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
    workers: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireWorkersView(context);
      return prisma.worker.findMany();
    },
    worker: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireWorkersView(context);
      return prisma.worker.findUnique({ where: { id } });
    },
  },
};
