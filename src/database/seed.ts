import pool from "../config/database";

const FAQ_DATA = {
  shipping:
    "We offer free shipping on orders over $50. Standard shipping takes 3-5 business days, express shipping takes 1-2 business days. We ship to all US states and most international locations.",
  returns:
    "We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Return shipping is free for defective items, $5 for other returns.",
  support:
    "Our customer support is available Monday-Friday 9AM-6PM EST. You can reach us via this chat, email at support@ourstore.com, or phone at 1-800-SUPPORT.",
  payment:
    "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted.",
  sizing:
    "Please check our size guide on each product page. If you're between sizes, we recommend sizing up. Free exchanges available within 30 days.",
};

async function seed() {
  try {
    console.log("Seeding database with FAQ data...");

    // Create a sample conversation for demonstration
    const conversationResult = await pool.query(
      "INSERT INTO conversations DEFAULT VALUES RETURNING id"
    );

    const conversationId = conversationResult.rows[0].id;

    // Add some sample messages
    await pool.query(
      `INSERT INTO messages (conversation_id, sender, text) VALUES 
       ($1, 'user', 'What is your shipping policy?'),
       ($1, 'ai', $2)`,
      [conversationId, FAQ_DATA.shipping]
    );

    console.log("Database seeded successfully!");
    console.log("Sample conversation ID:", conversationId);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

export default seed;
