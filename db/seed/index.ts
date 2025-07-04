import { db } from "@/db"; // Adjust the import path if your db/index.ts is elsewhere
import { prompts } from "../schema/prompts-schema"; // Import the Drizzle schema definition

// --- Clerk Backend Client Setup ---
import { createClerkClient } from "@clerk/backend";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY environment variable is not set.");
}
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
// --- End Clerk Setup ---

// --- Test User Definitions ---
const testUsers = [
  {
    emailAddress: ["user1+clerk_test@example.com"],
    password: "testPassword123!",
    firstName: "Test",
    lastName: "User1"
  },
  {
    emailAddress: ["user2+clerk_test@example.com"],
    password: "testPassword123!",
    firstName: "Test",
    lastName: "User2"
  },
  {
    emailAddress: ["user3+clerk_test@example.com"],
    password: "testPassword123!",
    firstName: "Test",
    lastName: "User3"
  }
];
// --- End Test User Definitions ---

// --- Base Prompt Data (without user_id yet) ---
const basePrompts = [
  { name: "Code Explainer", description: "Explains code in simple terms", content: "Explain this code..." },
  { name: "Bug Finder", description: "Helps identify bugs", content: "Find bugs in this code..." },
  { name: "Feature Planner", description: "Helps plan features", content: "Plan this feature..." },
  { name: "SQL Helper", description: "Assists with SQL", content: "Write SQL for..." },
  { name: "API Docs Writer", description: "Generates API docs", content: "Document this API..." },
  { name: "Code Refactorer", description: "Suggests improvements", content: "Refactor this code..." },
  { name: "Test Case Generator", description: "Creates test cases", content: "Generate tests for..." },
  { name: "UI/UX Reviewer", description: "Reviews UI/UX", content: "Review this UI..." },
  { name: "Git Command Helper", description: "Helps with Git", content: "Git command for..." },
];
// --- End Base Prompt Data ---

/**
 * An array of sample prompt objects to be inserted into the database.
 * Note: We don't specify 'id', 'created_at', or 'updated_at' as they
 * are handled automatically by the database/Drizzle schema defaults.
 */
const seedPrompts = [
  {
    name: "Code Explainer",
    description: "Explains code in simple terms",
    content: "Please explain this code in simple terms, as if you're teaching a beginner programmer:",
  },
  {
    name: "Bug Finder",
    description: "Helps identify bugs in code",
    content: "Review this code and identify potential bugs, performance issues, or security vulnerabilities:",
  },
  {
    name: "Feature Planner",
    description: "Helps plan new features",
    content: "Help me plan the implementation of this feature. Consider edge cases, potential challenges, and best practices:",
  },
  {
    name: "SQL Query Helper",
    description: "Assists with SQL queries",
    content: "Help me write an efficient SQL query to accomplish the following task:",
  },
  {
    name: "API Documentation",
    description: "Generates API documentation",
    content: "Generate clear and comprehensive documentation for this API endpoint, including parameters, responses, and examples:",
  },
  {
    name: "Code Refactorer",
    description: "Suggests code improvements",
    content: "Review this code and suggest improvements for better readability, maintainability, and performance:",
  },
  {
    name: "Test Case Generator",
    description: "Creates test cases",
    content: "Generate comprehensive test cases for this function, including edge cases and error scenarios:",
  },
  {
    name: "UI/UX Reviewer",
    description: "Reviews UI/UX design",
    content: "Review this UI design and provide feedback on usability, accessibility, and user experience:",
  },
   {
    name: "Git Command Helper",
    description: "Helps with Git commands",
    content: "What Git commands should I use to accomplish the following task:",
  }
];

/**
 * Asynchronous function to perform the database seeding operation.
 */
async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // --- Create Test Users via Clerk API ---
    console.log("Creating test users via Clerk API...");
    // Optional: Delete existing test users first for idempotency
    // const existingTestUsers = await clerk.users.getUserList({ emailAddress: testUsers.flatMap(u => u.emailAddress) });
    // if (existingTestUsers.data.length > 0) {
    //   console.log(`Deleting ${existingTestUsers.data.length} existing test users...");
    //   await Promise.all(existingTestUsers.data.map(user => clerk.users.deleteUser(user.id)));
    // }

    // Create users concurrently
    const createdUsers = await Promise.all(
      testUsers.map(userData => clerk.users.createUser(userData))
    );
    console.log(`Successfully created ${createdUsers.length} test users:`, createdUsers.map(u => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress })));
    // --- End User Creation ---

    // --- Prepare Prompts with User IDs ---
    if (createdUsers.length === 0) {
        throw new Error("No test users were created. Cannot proceed with seeding prompts.");
    }
    // Distribute prompts among the created users (e.g., round-robin or assign chunks)
    // Here, we assign every 3 prompts to a user (assuming 9 base prompts and 3 users)
    const promptsWithUsers = basePrompts.map((prompt, index) => {
        const userIndex = Math.floor(index / (basePrompts.length / createdUsers.length));
        const userId = createdUsers[userIndex].id;
        if (!userId) {
            throw new Error(`Could not get userId for user index ${userIndex}`);
        }
        return {
            ...prompt,
            user_id: userId, // Assign the Clerk user ID
        };
    });
    // --- End Prompt Preparation ---

    // --- Seed Database ---
    console.log("🗑️ Clearing existing data from 'prompts' table...");
    await db.delete(prompts); // Clear existing prompts first

    console.log("📥 Inserting seed data into 'prompts' table...");
    await db.insert(prompts).values(promptsWithUsers); // Insert prompts with user_id
    // --- End Database Seed ---

    console.log("✅ Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    if (error.errors) {
       console.error("Clerk API Errors:", error.errors);
    }
    throw error;
  } finally {
    // IMPORTANT: Ensure the database connection is closed
    // This might not be strictly necessary if drizzle-kit handles it,
    // but good practice for standalone scripts.
    // await db.$client.end(); // Uncomment if using node directly
    console.log("🚪 Seed script finished.");
  }
}

// Run the seed function
seed();
