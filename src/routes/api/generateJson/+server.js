// This is your existing /api/spell endpoint, renamed and cleaned up
import OpenAI from "openai";
import { OPENAI_API_TOKEN } from '$env/static/private';
import { systemPrompt } from "$lib/systemPrompt.js";

export async function POST({ request }) {
    try {
        const { prompt, schema, regenerateFromPrompt } = await request.json();
        
        const openai = new OpenAI({
            apiKey: OPENAI_API_TOKEN,
        });

        // Adjust system prompt based on the type of generation
        let effectiveSystemPrompt = systemPrompt;
        let userContent = '';

        if (regenerateFromPrompt || !schema) {
            // Full generation from prompt - don't reference existing schema
            effectiveSystemPrompt += "\n\nGenerate a complete 3D scene schema from scratch based on the user's description.";
            userContent = prompt;
        } else {
            // Modification of existing schema
            effectiveSystemPrompt += "\n\nModify the existing schema based on the user's request. Preserve the existing structure and parameters where possible, only changing what the user specifically requests.";
            userContent = `${prompt}\n\nCurrent schema (JSON):\n${JSON.stringify(schema)}`;
        }

        const response = await openai.responses.create({
            model: "o4-mini",
            input: [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": effectiveSystemPrompt
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": userContent
                        }
                    ]
                },
            ],
            text: {
                "format": {
                    "type": "json_object"
                }
            },
            reasoning: {},
            tools: [],
            temperature: 1,
            max_output_tokens: 16384,
            top_p: 1,
            store: true
        });

        // After the OpenAI call, before JSON.parse:
const rawOutput = response.output_text;

let generatedSchema;
try {
    // First try direct parsing
    generatedSchema = JSON.parse(rawOutput);
} catch (parseError) {
    // If that fails, try extracting JSON from the text
    const jsonMatch = rawOutput.match(/(\{[\s\S]*\})|(\[[\s\S]*\])/);
    if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
    }
    
    try {
        generatedSchema = JSON.parse(jsonMatch[0]);
    } catch (extractError) {
        console.error('Raw AI output:', rawOutput);
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
}

// Validate that we got a proper schema
if (!generatedSchema || typeof generatedSchema !== 'object') {
    throw new Error("AI response is not a valid object");
}


        //const generatedSchema = JSON.parse(response.output_text);
        
        return new Response(JSON.stringify(generatedSchema), {
            status: 200,
            headers: {
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (err) {
        console.error('Generate JSON error:', err);
    
    // More specific error messages
    let errorMessage = 'Failed to generate schema';
    if (err.message.includes('JSON')) {
        errorMessage = 'Failed to parse AI response as valid JSON';
    } else if (err.message.includes('token')) {
        errorMessage = 'Request too large or API quota exceeded';
    }
    
    return new Response(JSON.stringify({ 
        error: errorMessage,
        details: err.message,
        timestamp: new Date().toISOString()
    }), {
        status: 500,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
    }
}
