export async function POST({ request, locals }) {
    const { prompt, spell } = await request.json();

    try {
        await locals.pb.collection('promptsAndSpells').create({
            prompt: prompt,
            spell: spell
        });

        return new Response(JSON.stringify({ message: 'Success' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (err) {
        console.error('Save error:', err);
        return new Response(JSON.stringify({ error: 'Failed to save' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
