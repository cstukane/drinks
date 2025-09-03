
// exporter.js
// Handles SVG recipe card + share code encode/decode (URL hash).

// Function to encode recipe data into a compact share code
export function encodeShareCode(recipe) {
    try {
        // Stringify the recipe data
        const jsonString = JSON.stringify(recipe);
        
        // Compress using pako (deflate)
        const compressed = pako.deflate(jsonString, { to: 'string' });
        
        // Convert to base64 URL-safe encoding
        const binaryString = String.fromCharCode.apply(null, compressed);
        const base64 = btoa(binaryString);
        const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        
        return base64url;
    } catch (error) {
        console.error('Error encoding share code:', error);
        return null;
    }
}

// Function to decode share code back to recipe data
export function decodeShareCode(shareCode) {
    try {
        // Convert from base64 URL-safe encoding
        let base64 = shareCode.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        
        // Decode from base64
        const binaryString = atob(base64);
        const compressed = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            compressed[i] = binaryString.charCodeAt(i);
        }
        
        // Decompress using pako (inflate)
        const decompressed = pako.inflate(compressed, { to: 'string' });
        
        // Parse JSON
        const recipe = JSON.parse(decompressed);
        
        return recipe;
    } catch (error) {
        console.error('Error decoding share code:', error);
        return null;
    }
}

export function generateSVG(recipe, recipeDetails) {
    const { ingredientsWithVolumes, instructions } = recipeDetails;

    let ingredientsList = '';
    ingredientsWithVolumes.forEach((item, i) => {
        ingredientsList += `<text x="20" y="${100 + i * 20}">${item.volume} ${item.name}</text>`;
    });

    let instructionsList = '';
    instructions.forEach((step, i) => {
        instructionsList += `<text x="20" y="${200 + i * 20}">${i + 1}. ${step}</text>`;
    });

    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1a1a1a" />
            <text x="20" y="40" font-size="24" fill="#00ffff">${recipe.name || 'My Dicey Drink'}</text>
            <text x="20" y="60" font-size="16" fill="#f0f0f0">Method: ${recipe.method}</text>
            
            <g fill="#f0f0f0">
                ${ingredientsList}
            </g>

            <g fill="#f0f0f0">
                ${instructionsList}
            </g>
        </svg>
    `;

    return svg;
}

export function downloadSVG(svgString, filename = 'recipe.svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
