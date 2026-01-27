import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jubbpyoqcarnylbeslyz.supabase.co';
const supabaseServiceKey = 'sb_secret_ntnU3Ffh1CpL_6FQtPqoPw_WbnZo0YD';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
    const email = 'admin@internhub.com';
    const password = 'InternHubAdmin2026!';

    try {
        console.log(`� Checking if user ${email} exists...`);
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users.find(u => u.email === email);
        let userId;

        if (!user) {
            console.log('➕ Creating new user...');
            const { data, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });
            if (createError) throw createError;
            userId = data.user.id;
            console.log('✅ User created.');
        } else {
            userId = user.id;
            console.log('✅ User already exists.');
        }

        console.log(`Setting admin role for ${userId}...`);

        // Ensure profile exists
        const { error: pError } = await supabase.from('profiles').upsert({
            user_id: userId,
            email: email,
            role: 'admin',
            onboarding_completed: true
        }, { onConflict: 'user_id' });
        if (pError) throw pError;

        // Ensure role exists
        await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

        console.log('\n🎉 SUPER ADMIN READY');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        process.exit(0);
    }
}

createSuperAdmin();
