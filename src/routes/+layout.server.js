
export async function load({ locals }) {
    return { user: locals.user };   // will be null/undefined if not logged in
}