import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs, resolvers, type GraphQLContext } from '@studio/graphql';
import { NextRequest } from 'next/server';
import { resolveCallerCtx } from '@/lib/auth/with-permission';

const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
});

// version 3+ of @as-integrations/next supports App Router
const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
    context: async () => {
        const caller = await resolveCallerCtx();
        return {
            callerCtx: caller ? { isSuperAdmin: caller.isSuperAdmin, permissions: caller.permissions } : null,
        };
    },
});

export async function GET(request: NextRequest, context: any) {
    return (handler as any)(request, context);
}

export async function POST(request: NextRequest, context: any) {
    return (handler as any)(request, context);
}
