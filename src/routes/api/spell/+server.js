import OpenAI from "openai";
import { OPENAI_API_TOKEN } from '$env/static/private';
import { systemPrompt } from "$lib/systemPrompt.js";

export async function POST({ request, locals }) {
    try {

        const { prompt } = await request.json();
        console.log(request)
        console.log( prompt )

        const openai = new OpenAI({
            apiKey: OPENAI_API_TOKEN,
        });

        const query = prompt.query
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
                            "text": `${prompt}`
                        },
                        // {
                        //     "type": "input_image",
                        //     "image_url": ``
                        // }
                    ]
                },
            ],
            text: {
                "format": {
                    "type": "text"
                }
            },
            reasoning: {},
            tools: [
                {
                    "type": "web_search_preview",
                    "user_location": {
                        "type": "approximate",
                        "country": "US"
                    },
                    "search_context_size": "medium"
                }
            ],
            temperature: 1,
            max_output_tokens: 16384,
            top_p: 1,
            store: true
        });
        //console.log(response.output[0].content[0].text)
        const spell = JSON.parse(response.output_text);
        console.log(response.output_text)

        return new Response(JSON.stringify(spell), {
            status: 200,
            headers: {
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        }
        )
    } catch (err) {
        console.log(err)
    }
}