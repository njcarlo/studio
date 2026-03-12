import { getMealStubs } from './apps/web/src/actions/db';

async function test() {
    try {
        console.log('Testing getMealStubs action...');
        const stubs = await getMealStubs();
        console.log('Successfully fetched stubs:', stubs.length);
    } catch (err) {
        console.error('getMealStubs FAILED:', err);
    }
}

test();
