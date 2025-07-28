import { error, redirect } from '@sveltejs/kit'

export async function POST({ request, locals, cookies }) {
    const formData = await request.formData();
    const authType = formData.get('authType'); // 'email' or 'google'
    const email = formData.get('email')
    const password = formData.get('password')
    let response = {}

    console.log(request.headers.get('origin'))

    try {
            // Handle email/password login
            const email = formData.get('email');
            const password = formData.get('password');

            await locals.pb.collection('users').authWithPassword(email, password);

            // Check if the authentication was successful
            if (locals.pb.authStore.isValid) {
                const currentTime = new Date().toISOString();
                // Update the last login time for the authenticated user
                await locals.pb.collection("users").update(locals.pb.authStore.model.id, { lastLogin: currentTime });
                response = {
                    message: 'Success',
                    user: {
                        email: locals.pb.authStore.model.email,
                        id: locals.pb.authStore.model.id,
                        requests: locals.pb.authStore.model.requests,
                        verified: locals.pb.authStore.model.verified
                    }
                };
            } else {
                locals.pb.authStore.clear();
                response = {
                    message: 'Something went wrong',
                };
            }

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });

    } catch (err) {
        console.log('Error: ', err)
        throw error(500, 'Something went wrong while logging in')
    }
}