import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        // Initialize OpenAI (will fail if no key, but caught below)
        const openai = createOpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy-key', // Prevent crash on init, fail on call
        });

        try {
            const result = streamText({
                model: openai('gpt-4o-mini'),
                messages: [
                    {
                        role: "system",
                        content: "You are the AI engine of 'DoEverything App'. You are in a simulated demo environment. Mimic the actual product execution. If the user asks for an action (e.g., 'refund user', 'book meeting', 'analyze data'), DO NOT explain how you would do it. Instead, CONFIRM it is done. Invent realistic details. Example: 'Done! I've scheduled the meeting with Alex for Tuesday at 2 PM and sent invites.' or 'Refund processed. $50 has been returned to their card ending in 4242.' Keep it under 50 words. Be confident and helpful."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
            });
            return result.toTextStreamResponse();
        } catch (apiError) {
            console.warn("OpenAI API call failed, falling back to fake response:", apiError);
            // Fallback to fake strings
            const fakeResponses = [
                "I can verify that user's subscription in Stripe and issue a partial refund immediately. Would you like me to proceed?",
                "I'll query the PostgreSQL database for those metrics and generate a chart for your dashboard. Give me a second...",
                "Searching your Notion workspace for relevant docs... I found 3 pages. Summarizing them now.",
                "Connecting to GitHub to check the latest PR status. All checks passed! Ready to merge?"
            ];
            const randomResponse = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];

            // Return a simple text stream of the fake response
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(randomResponse));
                    controller.close();
                }
            });
            return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
    } catch (error) {
        console.error("Demo Chat Error:", error);
        // Ultimate fallback
        return new Response("I will connect to your apps and do that for you!", { status: 200 });
    }
}
