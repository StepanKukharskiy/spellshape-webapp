export async function exportSpellToGrasshopper(spellData, filename = 'updated-export.ghx') {
    // Fetch the template from public/static
    const response = await fetch('/spellshape_ghx_template.txt');
    const ghxTemplate = await response.text();

    // Serialize and escape the JSON for XML
    let jsonString = JSON.stringify(spellData, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Replace the UserText json content
    let updatedTemplate = ghxTemplate.replace(
        /(<item name="UserText"[^>]*>)([\s\S]*?)(<\/item>)/,
        (_, start, _old, end) => `${start}${jsonString}${end}`
    );

    // Create a Blob and trigger download
    const blob = new Blob([updatedTemplate], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Return the string in case you want to use it elsewhere
    return updatedTemplate;
}
