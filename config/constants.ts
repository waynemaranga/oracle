export const MODEL = "gpt-4o-mini";

// Environment variables
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
export const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
// export const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
// export const AZURE_OPENAI_MODEL = process.env.AZURE_OPENAI_MODEL;
export const COHERE_API_KEY = process.env.COHERE_API_KEY;
// export const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
// export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// export const MONGO_URI = process.env.MONGO_URI;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Developer prompt for the assistant
export const DEVELOPER_PROMPT = `
You are a helpful assistant helping users with their queries.
If they need up to date information, you can use the web search tool to search the web for relevant information.

If they mention something about themselves, their companies, or anything else specific to them, use the save_context tool to store that information for later.

If they ask for something that is related to their own data, use the file search tool to search their files for relevant information.
`;

// Here is the context that you have available to you:
// ${context}

// Initial message that will be displayed in the chat
export const INITIAL_MESSAGE = `
What's up? 😄
`;

export const defaultVectorStore = {
  id: "",
  name: "Example",
};
