import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

let out = "";

const stream = client.chatCompletionStream({
    model: "HuggingFaceTB/SmolLM3-3B:hf-inference",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}
}
