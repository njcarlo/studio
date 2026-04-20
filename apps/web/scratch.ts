import { prisma } from '@studio/database/prisma';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });



const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function main() {
    const targetEmail = 'johndavesalgado01@gmail.com';
    console.log(`Looking for ${targetEmail}...`);

    let page = 1;
    let keepGoing = true;

    while (keepGoing) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: 1000
        });

        if (error) {
            console.error('Error fetching users:', error);
            break;
        }

        const users = data.users;
        if (users.length === 0) {
            console.log('User not found in Auth DB.');
            break;
        }

        const targetUser = users.find(u => u.email === targetEmail);
        if (targetUser) {
            console.log(`Found orphaned auth user: ${targetUser.email} (${targetUser.id}). Deleting...`);
            await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
            console.log('Deleted successfully.');
            break;
        }
        page++;
    }
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
