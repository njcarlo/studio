import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs, resolvers } from '@studio/graphql';
import { NextRequest } from 'next/server';

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// version 3+ of @as-integrations/next supports App Router
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
    context: async (req) => ({ req }),
});

export async function GET(request: NextRequest, context: any) {
    return (handler as any)(request, context);
}

export async function POST(request: NextRequest, context: any) {
    return (handler as any)(request, context);
}
