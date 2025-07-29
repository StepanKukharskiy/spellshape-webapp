// This is your existing /api/spell endpoint, renamed and cleaned up
import OpenAI from "openai";
import { OPENAI_API_TOKEN } from '$env/static/private';
import { systemPrompt } from "$lib/systemPrompt.js";

export async function POST({ request }) {
    try {
        const { prompt, schema } = await request.json();
        
        const openai = new OpenAI({
            apiKey: OPENAI_API_TOKEN,
        });

        const response = await openai.responses.create({
            model: "o4-mini",
            input: [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": `${systemPrompt}`
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": schema
                                ? `${prompt}\n\nCurrent schema (JSON):\n${JSON.stringify(schema)}`
                                : prompt
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
            tools: [
            ],
            temperature: 1,
            max_output_tokens: 16384,
            top_p: 1,
            store: true
        });

        const generatedSchema = JSON.parse(response.output_text);
        
        return new Response(JSON.stringify(generatedSchema), {
            status: 200,
            headers: {
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (err) {
        console.error('Generate JSON error:', err);
        return new Response(JSON.stringify({ error: 'Failed to generate schema' }), {
            status: 500
        });
    }
}
