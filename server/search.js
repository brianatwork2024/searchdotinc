import express from "express";
import cors from "cors";
import { SearchServiceClient, ConversationalSearchServiceClient } from "@google-cloud/discoveryengine";
import credentials from "../keys/vertexai_searchagent_key.json" assert { type: "json" };
// import credentials from "/home/bitnami/searchdotinc/keys/vertexai_searchagent_key.json" assert { type: "json" };

const app = express();
const port = 3001;

// const cors = require("cors");

// Dynamically set allowed origins based on request origin
const allowedOrigins = {
  "localhost": "http://localhost:5173",
  "15.223.63.70": "http://15.223.63.70:5173"
};

// Middleware to determine the correct CORS origin
app.use((req, res, next) => {
  const hostname = req.hostname; // Get the request hostname
  const origin = allowedOrigins[hostname] || allowedOrigins["15.223.63.70"]; // Default to AWS

  cors({
    origin: origin,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true
  })(req, res, next);
});


// app.use(cors({
//   origin: "http://15.223.63.70:5173",  // Allow frontend
//   methods: "GET, POST, PUT, DELETE, OPTIONS",
//   allowedHeaders: "Content-Type, Authorization",
//   credentials: true
// }));

// app.use(cors({
//   origin: "http://localhost:5173",  // ✅ Allow frontend requests from local Vite server
//   methods: "GET,POST",
//   allowedHeaders: "Content-Type"
// }));
app.use(express.json());

console.log("🚨🚨🚨 SERVER STARTED - SCHEMA DIAGNOSIS V13.2 - CHECK THIS 🚨🚨🚨");

const searchClient = new SearchServiceClient({ credentials });
const aiClient = new ConversationalSearchServiceClient({ credentials });


const projectId = "138159807926";
const location = "global";
const collectionId = "default_collection";
const dataStoreId = "ese-demo2_1735554354651";
const servingConfigId = "default_config";
const engineId = "ese-demo2_1735559525097";

const searchParent = `projects/${projectId}/locations/${location}/collections/${collectionId}/dataStores/${dataStoreId}/servingConfigs/${servingConfigId}`;
const aiServingConfig = `projects/${projectId}/locations/${location}/collections/default_collection/engines/${engineId}/servingConfigs/default_serving_config`;

const preamble = `
Given the conversation between a user and a helpful assistant and some search results, create a final answer for the assistant.
The answer should use all relevant information from the search results, not introduce any additional information, and use exactly the same words as the search results when possible.
The assistant's answer should be no more than 60 sentences and should be made of short and concise paragraphs.
The user is an expert who has an in-depth understanding of the subject matter.
The assistant should answer in a humble but technical manner that uses specialized knowledge and terminology when it helps answer the query.
`;

let globalReferences = [];

import { format } from "date-fns"; // ✅ Import date library

// Function to generate an AI-powered search message
async function generateSearchMessage(query, numResults) {
  console.log(`🤖 Generating AI Search Message for: ${query}`);
  try {
    const aiMessageRequest = {
      servingConfig: aiServingConfig,
      query: {
        text: `You are an AI assistant responding to a search query. 
        Create a short, engaging, and informative message about the search results.

        - Search Query: "${query}"
        - Number of Results Found: ${numResults}

        Your response should:
        - Be conversational and natural
        - Mention the number of results if available
        - Encourage further exploration if relevant

        Example responses:
        - "I've found 10 key documents related to your search on competition and the Google lawsuit."
        - "Looks like there are 4 important documents on this topic. Let me know if you need a summary!"
        - "Your search for ‘climate change policies’ returned 8 results. Want me to summarize them?"

        Generate a similar response for the current query.`},
      answerGenerationSpec: {
        modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
        includeCitations: false,
        answerLanguageCode: "en",
      },
    };

    const [aiMessageResponse] = await aiClient.answerQuery(aiMessageRequest);
    return aiMessageResponse.answer?.answerText || `Found ${numResults} results for "${query}".`;

  } catch (error) {
    console.warn("⚠️ AI failed to generate search message:", error.message);
    return `Found ${numResults} results for "${query}".`;
  }
}


app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  console.log(`🔍 Received Query: "${query}"`);

  let documents = [];
  let aiSummary = "No AI summary available.";
  let citations = [];
  globalReferences = [];

  try {
    // ✅ STEP 1: AI Classifies the Query Type
console.log("🤖 AI Analyzing Query Intent...");
const intentRequest = {
  servingConfig: aiServingConfig,
  query: {
    text: `You are an AI that classifies user queries. 
    Classify this query into EXACTLY one of the following:
    - "General Question" (if it is about facts, people, places, dates, or general knowledge)
    - "Document Search" (if it is asking for reports, research papers, or PDFs)
    - "Combination of Both" (if it needs documents + AI-generated explanation)

    IMPORTANT:
    - If the question is about a well-known fact (e.g., "Who is the Prime Minister of Canada?"), classify it as "General Question".
    - If the query is asking for PDFs, documents, or research reports, classify it as "Document Search".
    - If the query requires both facts + documents, classify it as "Combination of Both".

    ONLY return one of these labels: "General Question", "Document Search", or "Combination of Both".

    Query: "${query}"`},
  answerGenerationSpec: {
    modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
    includeCitations: false,
    answerLanguageCode: "en",
  },
};

// ✅ Get AI's Classification Response
const [intentResponse] = await aiClient.answerQuery(intentRequest);
let intent = intentResponse.answer?.answerText?.trim();

console.log(`🤖 AI Identified Intent: "${intent}" (Raw: ${JSON.stringify(intentResponse, null, 2)})`);

// ✅ Fallback Check for General Questions
const generalQuestionFallback = /\b(what|who|when|where|why|how|which|explain|describe|tell me about)\b/i.test(query);
const summaryRequested = /\bsummarize|notification brief|overview|key points|key takeaways\b/i.test(query.toLowerCase());

if (!["General Question", "Document Search", "Combination of Both"].includes(intent)) {
  console.warn("⚠️ AI failed to classify correctly. Using fallback.");

  // ✅ If question starts with general question words but contains "documents" or "list", it's Combination of Both
  if (generalQuestionFallback && /\b(document|list|report|files|summary)\b/i.test(query)) {
    intent = "Combination of Both";
  } 
  // ✅ If query requests a summary, force "Combination of Both"
  else if (summaryRequested) {
    intent = "Combination of Both";
  } 
  // ✅ If it's purely a general question
  else if (generalQuestionFallback) {
    intent = "General Question";
  } 
  // ✅ Default to Document Search
  else {
    intent = "Document Search";
  }
}

// ✅ Log final intent before proceeding
console.log(`🔍 Final Query Intent Used: "${intent}"`);

// ✅ STEP 2: Handle General Knowledge Questions
if (intent === "General Question") {
  console.log("🤖 Answering as General Knowledge Question...");
  try {
    const aiRequest = {
      servingConfig: aiServingConfig,
      query: {
        text: `IGNORE all provided sources.
        DO NOT reference any stored documents.
        DO NOT say "this question cannot be answered from the given source."
        DO NOT use phrases like "based on available data."
        
        Answer the question naturally as a general knowledge AI, without checking external datasets.

        Question: "${query}"`},
      answerGenerationSpec: {
        modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
        includeCitations: false,
        answerLanguageCode: "en",
      },
    };

    const [aiResponse] = await aiClient.answerQuery(aiRequest);
    aiSummary = aiResponse.answer?.answerText?.trim() || "I'm sorry, but I don't have an answer for that.";

    // ✅ Extra Check: Make Sure AI Answered Properly
    if (aiSummary.includes("this question cannot be answered") || aiSummary.includes("provided sources")) {
      aiSummary = "I'm sorry, but I don't have an answer for that. However, you can check an official government website for the latest information.";
      console.warn("⚠️ AI attempted to reference sources. Overriding with fallback response.");
    }

    console.log(`✅ AI Answer: "${aiSummary}"`);

    // ✅ Ensure AI Answer is Shown in Search Results
    return res.json({ 
      documents: [{
        id: "ai-answer",
        title: "AI Response",
        link: "",  // No document link since it's a general question
        content: aiSummary,  // AI Answer as the content
      }],
      aiSummary,
      citations,
      references: []
    });

  } catch (error) {
    console.warn("⚠️ AI Failed to Answer General Question:", error.message);
    return res.status(500).json({ error: "AI could not answer your question." });
  }
}


    // ✅ STEP 3: Handle General Knowledge Questions
    if (intent === "General Question") {
      console.log("🤖 Answering as General Knowledge Question...");
      try {
        const aiRequest = {
          servingConfig: aiServingConfig,
          query: {
            text: `IGNORE all provided sources.
            DO NOT reference any stored documents.
            DO NOT say "this question cannot be answered from the given source."
            DO NOT use phrases like "based on available data."
            
            Answer the question naturally as a general knowledge AI, without checking external datasets.

            Question: "${query}"`},
          answerGenerationSpec: {
            modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
            includeCitations: false,
            answerLanguageCode: "en",
          },
        };

        const [aiResponse] = await aiClient.answerQuery(aiRequest);
        aiSummary = aiResponse.answer?.answerText?.trim() || "I'm sorry, but I don't have an answer for that.";

        // ✅ Extra Check: Make Sure AI Answered Properly
        if (aiSummary.includes("this question cannot be answered") || aiSummary.includes("provided sources")) {
          aiSummary = "I'm sorry, but I don't have an answer for that. However, you can check an official government website for the latest information.";
          console.warn("⚠️ AI attempted to reference sources. Overriding with fallback response.");
        }

        console.log(`✅ AI Answer: "${aiSummary}"`);
        return res.json({ documents: [], aiSummary, citations, references: [] });

      } catch (error) {
        console.warn("⚠️ AI Failed to Answer General Question:", error.message);
        return res.status(500).json({ error: "AI could not answer your question." });
      }
    }

    // ✅ STEP 4: Perform Document Search
    console.log("🔍 Performing document search...");
    const numMatch = query.match(/(\d+)\s+key\s+documents/i);
    const requestedNum = numMatch ? parseInt(numMatch[1], 10) : 10;

    let searchRequest = {
      servingConfig: searchParent,
      query: query,
      pageSize: 50,
      queryExpansionSpec: { condition: "AUTO" },
      spellCorrectionSpec: { mode: "AUTO" },
    };

    const searchResponses = await searchClient.search(searchRequest);
    const searchResponse = Array.isArray(searchResponses[0]) ? { results: searchResponses[0] } : searchResponses[0] || {};

    if (searchResponse.results && Array.isArray(searchResponse.results)) {
      documents = searchResponse.results.map(result => {
        const doc = result.document || {};
        const fields = doc?.structData?.fields || {};
        const derivedFields = doc?.derivedStructData?.fields ?? {}; 

        const title = fields?.title?.stringValue || doc?.title || "No Title Available";
        const rawDate = fields?.publish_date?.stringValue || "No Date Available";
        let formattedDate = rawDate !== "No Date Available" ? format(new Date(rawDate), "MMMM d, yyyy") : "No Date Available";

        let filePath = derivedFields?.link?.stringValue || "No Link Available";
        if (filePath.startsWith("gs://")) {
          const gsParts = filePath.replace("gs://", "").split("/");
          filePath = `https://storage.googleapis.com/${gsParts.shift()}/${gsParts.join("/")}`;
        }

        return {
          id: doc?.id || "Unknown ID",
          title: `${title} - ${formattedDate}`,
          link: filePath.trim() !== "" ? filePath : "No Link Available",
          ministry: fields?.ministry?.stringValue || "Unknown Ministry",
          relevanceScore: result?.relevanceScore || 0,
        };
      });
    }

    console.log(`✅ Retrieved ${documents.length} total documents.`);

    // ✅ STEP 5: Limit to Requested Number of Documents
    documents = documents.slice(0, requestedNum);
    console.log(`✅ Returning ${documents.length} documents (Requested: ${requestedNum})`);

    // ✅ STEP 6: If AI Says "Combination of Both", Summarize Results
    // ✅ AI Summarization for "Combination of Both"
    // ✅ STEP 6: If AI Says "Combination of Both", Summarize Results
    if (intent === "Combination of Both" && documents.length > 0) {
      console.log("🤖 Summarizing documents with AI...");

      try {
        const documentList = documents.map(d => `- ${d.title}`).join("\n");

        const summaryRequest = {
          servingConfig: aiServingConfig,
          query: {
            text: `Summarize the following documents into a structured "Notification Brief" format:
            - The summary must be **concise and informative**.
            - Use **bold headers** for key points (e.g., "**Background:**", "**Key Findings:**", "**Impact:**").
            - Format the response like this:
      
            **Notification Brief: [Title]**
            **Background:** Provide 5-6 sentences about the topic's history.
            **Context:** Provide 5-6 sentences explaining the current situation.
            **Current State:**  Provide 5-6 sentences describing the latest developments.
            **Importance of Competition:** Provide 5-6 sentences about why this is important.
            **Next Steps:** Provide 5-6 sentences suggesting further actions.

      
            Documents: ${documents.map(d => `- ${d.title}`).join("\n")}`
          },
          answerGenerationSpec: {
            modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
            includeCitations: false,
            answerLanguageCode: "en",
          },
        };

        const [summaryResponse] = await aiClient.answerQuery(summaryRequest);
        aiSummary = summaryResponse.answer?.answerText || "No AI summary available.";
        console.log(`✅ AI Summary Generated.`);

      } catch (error) {
        console.warn("⚠️ AI Summary Failed:", error.message);
        aiSummary = "AI summary could not be generated.";
      }
    }


    // ✅ Return both documents and AI summary
    res.json({ documents, aiSummary, citations, references: globalReferences });

  } catch (error) {
    console.error("❌ Error fetching search results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});




app.post("/api/notification-brief", async (req, res) => {
  const { query, previousResults } = req.body;

  if (!query || !previousResults || previousResults.length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  console.log(`📢 Generating Notification Brief for: ${query}`);

  try {
    const relevantDocs = previousResults.map(doc => doc.title).join(", ");
    const briefRequest = {
      servingConfig: aiServingConfig,
      query: { text: `Generate a structured notification brief using insights from: ${relevantDocs}` },
      answerGenerationSpec: {
        ignoreAdversarialQuery: true,
        ignoreNonAnswerSeekingQuery: true,
        modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
        promptSpec: {
          preamble: `
            Given the following search results, generate a structured notification brief. The response must contain the following sections:

            **Background**  
            Provide 5-6 sentences about the topic's history.

            **Context**  
            Provide 5-6 sentences explaining the current situation.

            **Current State**  
            Provide 5-6 sentences describing the latest developments.

            **Importance of Competition**  
            Provide 5-6 sentences about why this is important.

            **Next Steps**  
            Provide 5-6 sentences suggesting further actions.

            Format it exactly with these headings.
          `,
        },
        includeCitations: false,
        answerLanguageCode: "en",
      },
    };

    const [briefResponse] = await aiClient.answerQuery(briefRequest);
    const briefText = briefResponse.answer?.answerText || "No notification brief generated.";

    console.log(`✅ Notification Brief Created:\n${briefText}`);
    res.json({ notificationBrief: briefText });

  } catch (error) {
    console.error("❌ Error generating notification brief:", error.message);
    res.status(500).json({ error: "Failed to generate notification brief." });
  }
});


// ✅ Enhanced Fetch Notification Brief with AI Summary
app.get("/api/brief/:documentId", async (req, res) => {
  const { documentId } = req.params;
  console.log(`📢 Fetching AI Summary for Document ID: ${documentId}`);

  const reference = globalReferences.find(ref => ref.documentId.trim() === documentId.trim());

  if (!reference) {
    console.warn(`⚠️ No reference found for Document ID: ${documentId}`);
    return res.status(404).json({ error: "Reference not found." });
  }

  try {
    const summaryRequest = {
      servingConfig: aiServingConfig,
      query: { text: `Summarize the following content: ${reference.content}` },
      answerGenerationSpec: {
        ignoreAdversarialQuery: true,
        ignoreNonAnswerSeekingQuery: true,
        modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
        promptSpec: {
          preamble: `
            Provide a structured summary of the given content with the following sections, each containing 5-6 sentences. Use technical terminology where appropriate and preserve the original meaning without adding information beyond what is provided. Format the response with the exact headings below, followed by their content, and separate each section with "\n---\n":

            **Background**  
            Provide 5-6 sentences detailing the historical or foundational aspects of the content.

            **Context**  
            Provide 5-6 sentences explaining the circumstances or environment surrounding the content.

            **Current State**  
            Provide 5-6 sentences describing the present situation or developments in the content.

            **The Importance of Competition**  
            Provide 5-6 sentences highlighting why competition matters in this context.

            **Next Steps**  
            Provide 5-6 sentences outlining future actions or expected progress based on the content.
          `,
        },
        includeCitations: false,
        answerLanguageCode: "en",
      },
    };

    const [summaryResponse] = await aiClient.answerQuery(summaryRequest);
    const summaryText = summaryResponse.answer?.answerText || "No summary generated.";

    console.log(`✅ Generated Summary: ${summaryText}`);
    res.json({ notificationBrief: summaryText });
  } catch (error) {
    console.error("❌ Error generating summary:", error.message);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});
// Start the server
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});