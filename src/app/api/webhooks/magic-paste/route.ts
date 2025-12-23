import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { decrypt } from "@/lib/encryption";
import OpenAI from "openai";
import { z } from "zod";

const WebhookSchema = z.object({
    name: z.string().describe("A short, descriptive name for the webhook"),
    description: z.string().describe("A description of what the webhook does"),
    endpointUrl: z.string().url().describe("The full URL of the webhook endpoint"),
    httpMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("The HTTP method"),
    headers: z.record(z.string(), z.string()).optional().describe("Key-value pairs of headers"),
    fields: z.array(z.object({
        key: z.string(),
        type: z.enum(["string", "number", "boolean", "object", "array"]),
        required: z.boolean(),
        description: z.string().optional()
    })).describe("The fields required in the request body")
});

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate User
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Parse Request
        const { text, projectId } = await req.json();
        if (!text || !projectId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 3. Use Company API Key (Magic Paste is a provided utility)
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.error("Magic Paste Error: OPENAI_API_KEY is not set in server environment.");
            return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 });
        }

        // 4. Call OpenAI
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Use a smart model for this
            messages: [
                {
                    role: "system",
                    content: `You are an expert API developer and integration specialist.
Your task is to analyze the provided text (which could be a cURL command, API documentation snippet, or a natural language description) and extract the configuration for a webhook.

Return a JSON object matching this structure:
{
  "name": "Suggested Name",
  "description": "Brief description",
  "endpointUrl": "https://api.example.com/...",
  "httpMethod": "POST", // or GET, PUT, etc.
  "headers": { "Content-Type": "application/json" }, // Extract any headers
  "fields": [
    { "key": "field_name", "type": "string", "required": true, "description": "Field description" }
  ]
}

Rules:
- If the text is a cURL command, extract the URL, method, headers, and body fields.
- If it's documentation, infer the schema.
- If it's a description (e.g., "Send a message to Slack"), try to infer standard fields if you know the API, otherwise create logical placeholders.
- For 'fields', only include the JSON body parameters.
- Ensure 'type' is one of: string, number, boolean, object, array.
`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content from OpenAI");
        }

        const parsedData = JSON.parse(content);

        // Validate with Zod (optional but good practice)
        const validatedData = WebhookSchema.parse(parsedData);

        return NextResponse.json(validatedData);

    } catch (error: any) {
        console.error("Magic Paste Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
