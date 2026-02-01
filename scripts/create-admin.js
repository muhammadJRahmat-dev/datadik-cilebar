const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    const email = 'admin@datadikcilebar.my.id';
    const password = '050597@Jr';
    const fullName = 'Super Admin Kecamatan';

    console.log(`Creating/Updating admin user: ${email}...`);

    // 1. Create or Update User in Auth
    // Note: key should be 'email_confirm' to auto-confirm if email confirmation is enabled, 
    // but usually admin.createUser confirms by default.
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });

    if (userError) {
        if (userError.message.includes('already has been registered')) {
            console.log('User already exists via Auth API. Trying to update password...');
            // If user exists, we might want to update the password?
            // First get the user ID
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    existingUser.id,
                    { password: password, user_metadata: { full_name: fullName } }
                );
                if (updateError) {
                    console.error('Failed to update existing user password:', updateError.message);
                } else {
                    console.log('Existing user password updated successfully.');
                    await upsertProfile(existingUser.id, fullName);
                }
            }
        } else {
            console.error('Error creating user:', userError.message);
            return;
        }
    } else {
        console.log(`User created successfully! ID: ${userData.user.id}`);
        await upsertProfile(userData.user.id, fullName);
    }
}

async function upsertProfile(userId, fullName) {
    console.log('Upserting admin profile...');
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            role: 'admin_kecamatan',
            full_name: fullName,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error creating profile:', error.message);
    } else {
        console.log('Profile created/updated successfully with role: admin_kecamatan');
    }
}

createAdminUser();
