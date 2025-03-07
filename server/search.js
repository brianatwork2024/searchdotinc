import express from "express";
import cors from "cors";
import { SearchServiceClient, ConversationalSearchServiceClient } from "@google-cloud/discoveryengine";
// import credentials from "../keys/vertexai_searchagent_key.json" assert { type: "json" };
import credentials from "/home/bitnami/searchdotinc/keys/vertexai_searchagent_key.json" assert { type: "json" };

const app = express();
const port = 3001;

app.use(cors({
  origin: "http://15.223.63.70:5173",  // Allow frontend
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true
}));

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

app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  console.log(`🔍 Searching for: ${query}`);

  let documents = [];
  let aiSummary = "No AI summary available.";
  let citations = [];
  globalReferences = [];

  try {
    // ✅ Step 1: Parse Query for Number of Results, Author, and Search Terms
    const numMatch = query.match(/(\d+)\s+key\s+documents/i);
    const desiredNum = numMatch ? parseInt(numMatch[1], 10) : 10;
    const authorMatch = query.match(/written by (.*?)(?:\.|$)/i);
    const author = authorMatch ? authorMatch[1].trim() : null;
    const searchTerms = query
      .replace(/What are the \d+ key documents related to /i, "")
      .replace(/written by .*?(?:\.|$)/i, "")
      .trim();

    console.log(`🔍 Parsed - Desired Results: ${desiredNum}, Author: ${author || "Not specified"}, Search Terms: ${searchTerms}`);

    // ✅ Step 2: Perform Traditional Search
    const searchRequest = {
      servingConfig: searchParent,
      query: searchTerms,
      pageSize: desiredNum,
      queryExpansionSpec: { condition: "AUTO" },
      spellCorrectionSpec: { mode: "AUTO" },
      // Filter removed until correct field is identified
    };

    console.log("🔍 Sending search request...");
    const searchResponses = await searchClient.search(searchRequest);
    console.log("🔎 FULL SEARCH RESPONSE:", JSON.stringify(searchResponses, null, 2));

    const searchResponse = Array.isArray(searchResponses[0]) ? { results: searchResponses[0] } : searchResponses[0] || {};

    if (!searchResponse.results || !Array.isArray(searchResponse.results)) {
      console.warn("⚠️ searchResponse.results is missing or not an array!");
    } else {
      documents = searchResponse.results
        .map(result => {
          if (!result.document || !result.document.derivedStructData) {
            console.warn("⚠️ Skipping document with missing data:", result);
            return null;
          }
          const doc = result.document;
          const fields = doc.derivedStructData.fields || {};
          console.log("🔍 Document Fields for", doc.id, ":", JSON.stringify(fields, null, 2)); // ✅ Log fields
          let filePath = fields?.link?.stringValue || "";
          let title = fields?.title?.stringValue || "No Title Available";
          let dateModified =
            fields?.dateModified?.stringValue ||
            doc?.indexTime ||
            doc?.indexStatus?.updateTime ||
            "No Date Available";
          let relevanceScore = result?.relevanceScore || 0;

          if (filePath.startsWith("gs://")) {
            const gsParts = filePath.replace("gs://", "").split("/");
            const bucketName = gsParts.shift();
            const fileName = gsParts.join("/");
            filePath = `https://storage.googleapis.com/${bucketName}/${fileName}`;
          }

          return {
            id: doc.id || "Unknown ID",
            title,
            link: filePath || "No Link Available",
            dateModified,
            relevanceScore,
            hasSummary: false,
          };
        })
        .filter(doc => doc !== null);

      console.log(`✅ Retrieved ${documents.length} results from search`);
      console.log("📜 Document IDs:", documents.map(doc => doc.id));
    }

    if (documents.length > 0) {
      try {
        const aiRequest = {
          servingConfig: aiServingConfig,
          query: { text: searchTerms },
          session: null,
          queryUnderstandingSpec: {
            queryRephraserSpec: { disable: false, maxRephraseSteps: 1 },
            queryClassificationSpec: { types: ["ADVERSARIAL_QUERY", "NON_ANSWER_SEEKING_QUERY"] },
          },
          answerGenerationSpec: {
            ignoreAdversarialQuery: false,
            ignoreNonAnswerSeekingQuery: false,
            ignoreLowRelevantContent: false,
            modelSpec: { modelVersion: "gemini-1.5-flash-001/answer_gen/v2" },
            promptSpec: { preamble: preamble },
            includeCitations: true,
            answerLanguageCode: "en",
          },
        };

        const [aiResponse] = await aiClient.answerQuery(aiRequest);
        console.log("🔥 FULL AI RESPONSE:", JSON.stringify(aiResponse, null, 2));

        aiSummary = aiResponse.answer?.answerText || "No AI summary available.";

        globalReferences = aiResponse.answer?.references?.map(ref => {
          console.log("🔍 Full Ref:", JSON.stringify(ref, null, 2));
          const metadata = ref.chunkInfo?.documentMetadata || ref.documentMetadata || {};
          const documentPath = ref.document || metadata.document || "";
          let documentId = "No Document ID";

          if (documentPath.includes("/documents/")) {
            documentId = documentPath.split("/documents/")[1];
          } else if (documentPath) {
            const parts = documentPath.split("/");
            documentId = parts[parts.length - 1];
          }

          console.log("🔍 Document Path:", documentPath);
          console.log("🔍 Extracted ID:", documentId);

          const hasContent = ref.chunkInfo?.content && ref.chunkInfo.content !== "No Content Available";
          const doc = documents.find(d => d.id === documentId);
          if (doc && hasContent) {
            doc.hasSummary = true;
          }

          return {
            content: ref.chunkInfo?.content || "No Content Available",
            documentId: documentId,
            uri: metadata.uri || "No URI Available",
            title: metadata.title || "No Title Available",
            relevanceScore: ref.chunkInfo?.relevanceScore || "No Score Available",
          };
        }) || [];

        console.log("🔗 Reference Document IDs:", globalReferences.map(ref => ref.documentId));

        // ✅ Limit to desired number without hasSummary filter
        documents = documents
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, desiredNum);
        console.log("🔍 Final Documents with Titles:", JSON.stringify(documents.map(d => ({ id: d.id, title: d.title, hasSummary: d.hasSummary })), null, 2));
      } catch (aiError) {
        console.warn("⚠️ AI Answer request failed:", aiError.message);
      }
    }

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